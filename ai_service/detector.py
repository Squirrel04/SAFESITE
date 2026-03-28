from ultralytics import YOLO
import cv2
import numpy as np

class PPE_Detector:
    def __init__(self, model_path="runs/detect/yolov8n_custom/weights/best.pt"):
        import os
        if os.path.exists(model_path):
            self.model = YOLO(model_path)
            self.is_custom = True
            print(f"Loaded custom model: {model_path}")
        else:
            print(f"Custom model not found at {model_path}. Falling back to default yolov8n.pt")
            self.model = YOLO("yolov8n.pt")
            self.is_custom = False
            
        self.classes = self.model.names

    def calculate_iou(self, box1, box2):
        x_left = max(box1[0], box2[0])
        y_top = max(box1[1], box2[1])
        x_right = min(box1[2], box2[2])
        y_bottom = min(box1[3], box2[3])

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        intersection_area = (x_right - x_left) * (y_bottom - y_top)
        box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
        box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])

        # Overlapping percentage of the smaller object (helmet/vest) inside the larger object (person)
        return intersection_area / min(box1_area, box2_area)

    def detect(self, frame):
        results = self.model(frame)
        detections = []
        
        # Parse all raw boxes for overlap logic
        raw_boxes = []
        for result in results:
            for box in result.boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                if conf < 0.40: continue
                xyxy = box.xyxy[0].tolist()
                label = self.classes[cls_id].lower()
                raw_boxes.append({"label": label, "conf": conf, "box": xyxy})

        # Process detections
        for item in raw_boxes:
            label = item["label"]
            conf = item["conf"]
            xyxy = item["box"]
            x1, y1, x2, y2 = map(int, xyxy)
            w, h = x2 - x1, y2 - y1
            status = "safe"
            color = (0, 255, 0)
            final_label = label.title()

            # MACHINERY / VEHICLE logic - strict separation from PPE
            if label in ['machinery', 'vehicle', 'truck', 'car', 'excavator']:
                final_label = f"Info: {label.title()} Active"
                status = "safe" # Informational, completely bypassing PPE logic
                color = (255, 165, 0) # Orange
                
            # PERSON logic
            elif label == 'person':
                # 1. Fall Detection
                if w > h * 1.3:
                    final_label = "Fall Risk: Person Down"
                    status = "violation"
                    color = (0, 0, 255)
                else:
                    if self.is_custom:
                        # 2. PPE Detection via custom classes bounding boxes
                        has_helmet = any(b["label"] in ["hardhat", "helmet"] and self.calculate_iou(xyxy, b["box"]) > 0.3 for b in raw_boxes)
                        has_vest = any(b["label"] == "vest" and self.calculate_iou(xyxy, b["box"]) > 0.3 for b in raw_boxes)
                        
                        if not has_helmet and not has_vest:
                            final_label = "Violation: No PPE"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_helmet:
                            final_label = "Violation: No Helmet"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_vest:
                            final_label = "Violation: No Vest"
                            status = "violation"
                            color = (0, 0, 255)
                        else:
                            final_label = "Safe: PPE Correct"
                            color = (0, 255, 0)
                    else:
                        # 2. Fallback heuristic PPE Detection (only for base yolov8n model)
                        has_helmet = self.check_helmet_legacy(frame, xyxy)
                        has_vest = self.check_vest_legacy(frame, xyxy)
                        if not has_helmet and not has_vest:
                            final_label = "Violation: No PPE"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_helmet:
                            final_label = "Violation: No Helmet"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_vest:
                            final_label = "Violation: No Vest"
                            status = "violation"
                            color = (0, 0, 255)
                        else:
                            final_label = "Safe: PPE Correct"

                    # 3. Zone Detection
                    h_frame, w_frame = frame.shape[:2]
                    if y2 > h_frame * 0.8:
                        final_label = "Unauthorized: Danger Zone"
                        status = "violation"
                        color = (0, 0, 255)
            
            # Unsafe items
            elif label == 'cell phone':
                final_label = "Unsafe: Phone Usage"
                status = "violation"
                color = (0, 165, 255)

            # Ignore rendering standalone PPE items unless as part of someone
            if label in ['hardhat', 'helmet', 'vest', 'boots', 'glasses', 'gloves']:
                continue

            # Skip safe generic objects to avoid clutter
            if status == "safe" and final_label.lower() == label:
                continue

            detections.append({
                "label": final_label,
                "confidence": conf,
                "box": xyxy,
                "status": status
            })
            
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, final_label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        return detections, frame

    def check_helmet_legacy(self, frame, xyxy):
        x1, y1, x2, y2 = map(int, xyxy)
        head_h = int((y2 - y1) / 5)
        roi = frame[max(0,y1):min(frame.shape[0],y1+head_h), max(0,x1):min(frame.shape[1],x2)]
        if roi.size == 0: return False
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        lower_yellow = np.array([20, 100, 100])
        upper_yellow = np.array([30, 255, 255])
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        _, bright = cv2.threshold(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), 200, 255, cv2.THRESH_BINARY)
        return cv2.countNonZero(mask_yellow) > 20 or cv2.countNonZero(bright) > 40

    def check_vest_legacy(self, frame, xyxy):
        x1, y1, x2, y2 = map(int, xyxy)
        h = y2 - y1
        roi = frame[max(0,y1+int(h/4)):min(frame.shape[0],y1+int(h*3/4)), max(0,x1):min(frame.shape[1],x2)]
        if roi.size == 0: return False
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        lower_orange = np.array([0, 100, 100])
        upper_orange = np.array([15, 255, 255])
        lower_neon = np.array([35, 100, 100])
        upper_neon = np.array([85, 255, 255])
        mask_o = cv2.inRange(hsv, lower_orange, upper_orange)
        mask_n = cv2.inRange(hsv, lower_neon, upper_neon)
        return cv2.countNonZero(mask_o) > 50 or cv2.countNonZero(mask_n) > 50
