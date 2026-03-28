import cv2
from ultralytics import YOLO

class PPE_Detector:
    def __init__(self, ppe_model_path="ppe_repo/models/best.pt", phone_model_path="yolov8m.pt"):
        import os
        
        # 1. Load the highly accurate YOLO medium model for cell phones and humans
        print(f"Loading Base Human/Phone model: {phone_model_path}")
        self.phone_model = YOLO(phone_model_path)
        
        # 2. Load the custom PPE weights
        if os.path.exists(ppe_model_path):
            print(f"Loading Custom PPE model: {ppe_model_path}")
            self.ppe_model = YOLO(ppe_model_path)
            self.has_ppe = True
        else:
            print(f"Warning: {ppe_model_path} not found. PPE checking will be disabled.")
            self.ppe_model = None
            self.has_ppe = False
        self.muted_labels = []
            
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
        
        denominator = min(box1_area, box2_area)
        if denominator <= 0:
            return 0.0

        # Overlapping percentage of the smaller object (PPE) inside the larger object (person)
        return intersection_area / denominator

    def detect(self, frame):
        detections = []
        
        # 1. PREDICT PHONE/HUMAN
        persons = []
        other_phone_boxes = []
        phone_results = self.phone_model(frame, classes=[0, 67], verbose=False)
        for result in phone_results:
            for box in result.boxes:
                if float(box.conf[0]) < 0.25: continue
                xyxy = box.xyxy[0].tolist()
                label = self.phone_model.names[int(box.cls[0])].lower()
                if label == 'person':
                    persons.append({"box": xyxy, "conf": float(box.conf[0])})
                else:
                    other_phone_boxes.append({"label": label, "box": xyxy, "conf": float(box.conf[0])})

        # 2. PREDICT PPE ITEMS
        ppe_boxes = []
        if self.has_ppe:
            ppe_results = self.ppe_model(frame, verbose=False)
            for result in ppe_results:
                for box in result.boxes:
                    if float(box.conf[0]) < 0.35: continue
                    xyxy = box.xyxy[0].tolist()
                    label = self.ppe_model.names[int(box.cls[0])].lower()
                    ppe_boxes.append({"label": label, "box": xyxy, "conf": float(box.conf[0])})

        # 3. VERIFY 4-PIECE PPE ON INDIVIDUAL HUMANS
        for p in persons:
            xyxy = p["box"]
            x1, y1, x2, y2 = map(int, xyxy)
            w, h = x2 - x1, y2 - y1
            status = "safe"
            color = (0, 255, 0)
            
            # Check 4 distinct PPE items intersecting this person
            has_helmet = any(b["label"] in ["hardhat", "helmet", "safety helmet"] and self.calculate_iou(xyxy, b["box"]) > 0.15 for b in ppe_boxes)
            has_vest = any(b["label"] in ["vest", "safety vest"] and self.calculate_iou(xyxy, b["box"]) > 0.15 for b in ppe_boxes)
            has_shoes = any(b["label"] in ["shoes", "boots", "safety shoes"] and self.calculate_iou(xyxy, b["box"]) > 0.15 for b in ppe_boxes)
            has_gloves = any(b["label"] in ["gloves", "safety gloves"] and self.calculate_iou(xyxy, b["box"]) > 0.15 for b in ppe_boxes)

            missing = []
            if not has_helmet: missing.append("Helmet")
            if not has_vest: missing.append("Vest")
            # We ONLY alert for Shoes and Gloves explicitly to avoid redundant noisy arrays
            if not has_shoes: missing.append("Shoes")
            if not has_gloves: missing.append("Gloves")

            if w > h * 1.3:
                final_label = "Fall Risk: Person Down"
                status = "violation"
                color = (0, 0, 255)
            elif missing:
                if len(missing) >= 3:
                    final_label = "Violation: No PPE"
                else:
                    final_label = f"Violation: No {', '.join(missing)}"
                status = "violation"
                color = (0, 0, 255)
            else:
                final_label = "Safe: Full PPE"
                color = (0, 255, 0)

            # Zone Check
            h_frame, w_frame = frame.shape[:2]
            if y2 > h_frame * 0.8:
                final_label = "Unauthorized: Danger Zone"
                status = "violation"
                color = (0, 0, 255)

            if final_label in self.muted_labels:
                continue

            detections.append({"label": final_label, "confidence": p["conf"], "box": xyxy, "status": status})
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, final_label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.4, color, 2)

        # 4. RENDER OTHER ITEMS (Machinery, Phones)
        for obj in ppe_boxes + other_phone_boxes:
            label = obj["label"]
            if label in ['hardhat', 'helmet', 'vest', 'safety vest', 'shoes', 'boots', 'gloves', 'person', 'no-hardhat', 'no-safety vest', 'no-mask', 'mask', 'safety cone']:
                continue 
                
            xyxy = obj["box"]
            x1, y1, x2, y2 = map(int, xyxy)
            
            if label in ['machinery', 'vehicle', 'truck', 'car', 'excavator']:
                final_label = f"Info: {label.title()} Active"
                status = "safe" 
                color = (255, 165, 0)
            elif label == 'cell phone':
                final_label = "Unsafe: Phone Usage"
                status = "violation"
                color = (0, 165, 255)
            else:
                continue

            if final_label in self.muted_labels:
                continue

            detections.append({"label": final_label, "confidence": obj["conf"], "box": xyxy, "status": status})
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(frame, final_label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        return detections, frame
