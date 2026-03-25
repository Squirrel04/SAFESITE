from ultralytics import YOLO
import cv2
import numpy as np

class PPE_Detector:
    def __init__(self, model_path="yolov8n.pt"):
        self.model = YOLO(model_path)
        # Class names for standard YOLOv8n (COCO). 
        # For actual PPE, we would need a custom trained model.
        # Mapping standard classes to "PPE" for demo:
        # person -> person
        # (We will simulate PPE detection logic on top of 'person' detection for now if using base model)
        self.classes = self.model.names
        # Define Unauthorized Zone: (x, y, w, h) normalized? No, use absolute for simplicity now.
        # Or just a line/rectangle.

    def detect(self, frame):
        results = self.model(frame)
        detections = []
        for result in results:
            boxes = result.boxes
            for box in boxes:
                cls_id = int(box.cls[0])
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                label = self.classes[cls_id]
                
                if conf < 0.40: continue

                x1, y1, x2, y2 = map(int, xyxy)
                w, h = x2 - x1, y2 - y1
                status = "safe"
                color = (0, 255, 0) # Default green

                if label == 'person':
                    # 1. Fall Detection (Aspect Ratio)
                    if w > h * 1.3:
                        label = "Fall Risk: Person Down"
                        status = "violation"
                        color = (0, 0, 255)
                    else:
                        # 2. PPE Detection (Helmet & Vest)
                        has_helmet = self.check_helmet(frame, xyxy)
                        has_vest = self.check_vest(frame, xyxy)
                        
                        if not has_helmet and not has_vest:
                            label = "Violation: No PPE"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_helmet:
                            label = "Violation: No Helmet"
                            status = "violation"
                            color = (0, 0, 255)
                        elif not has_vest:
                            label = "Violation: No Vest"
                            status = "violation"
                            color = (0, 0, 255)
                        else:
                            label = "Safe: PPE Correct"
                        
                        # 3. Zone Detection (Unauthorized Area)
                        # Let's say bottom 20% of frame is danger zone
                        h_frame, w_frame = frame.shape[:2]
                        if y2 > h_frame * 0.8:
                            label = "Unauthorized: Danger Zone"
                            status = "violation"
                            color = (0, 0, 255)
                
                elif label == 'truck':
                    label = "Alert: Machinery Usage"
                    status = "violation"
                    color = (255, 165, 0) # Orange
                
                elif label == 'cell phone':
                    label = "Unsafe: Phone Usage"
                    status = "violation"
                    color = (0, 165, 255) # Orange

                # Skip other boring COCO classes for the demo
                if status == "safe" and label not in ["Safe: PPE Correct", "person"]:
                    continue

                detections.append({
                    "label": label,
                    "confidence": conf,
                    "box": xyxy,
                    "status": status
                })
                
                # Draw
                cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                cv2.putText(frame, f"{label}", (x1, y1 - 10), 
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        return detections, frame

    def check_helmet(self, frame, xyxy):
        x1, y1, x2, y2 = map(int, xyxy)
        head_h = int((y2 - y1) / 5)
        roi = frame[y1:y1+head_h, x1:x2]
        if roi.size == 0: return False
        
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        # Yellow & White detection
        lower_yellow = np.array([20, 100, 100])
        upper_yellow = np.array([30, 255, 255])
        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        
        # Simple brightness check for white helmets
        _, bright = cv2.threshold(cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY), 200, 255, cv2.THRESH_BINARY)
        
        return cv2.countNonZero(mask_yellow) > 20 or cv2.countNonZero(bright) > 40

    def check_vest(self, frame, xyxy):
        x1, y1, x2, y2 = map(int, xyxy)
        h = y2 - y1
        # Vest is in the middle of the body
        roi = frame[y1+int(h/4):y1+int(h*3/4), x1:x2]
        if roi.size == 0: return False
        
        hsv = cv2.cvtColor(roi, cv2.COLOR_BGR2HSV)
        # Neon Orange / Green ranges
        lower_orange = np.array([0, 100, 100])
        upper_orange = np.array([15, 255, 255])
        lower_neon = np.array([35, 100, 100])
        upper_neon = np.array([85, 255, 255])
        
        mask_o = cv2.inRange(hsv, lower_orange, upper_orange)
        mask_n = cv2.inRange(hsv, lower_neon, upper_neon)
        
        return cv2.countNonZero(mask_o) > 50 or cv2.countNonZero(mask_n) > 50
