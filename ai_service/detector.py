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
                
                if conf > 0.5:
                    if label == 'person':
                        # Heuristic: Check for hard hat (yellow/white) in top region of box
                        has_helmet = self.check_ppe(frame, box, xyxy)
                        if has_helmet:
                            label = "Safe: Helmet"
                            color = (0, 255, 0) # Green
                        else:
                            label = "Violation: No Helmet"
                            color = (0, 0, 255) # Red
                    else:
                        color = (255, 0, 0)

                    detections.append({
                        "label": label,
                        "confidence": conf,
                        "box": xyxy,
                        "status": "safe" if "Safe" in label else "violation"
                    })
                    
                    # Draw custom box
                    x1, y1, x2, y2 = map(int, xyxy)
                    cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
                    cv2.putText(frame, f"{label} {conf:.2f}", (x1, y1 - 10), 
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)

        return detections, frame

    def check_ppe(self, frame, box, xyxy):
        # Extract head region (top 1/5th of bounding box)
        x1, y1, x2, y2 = map(int, xyxy)
        height = y2 - y1
        head_h = int(height / 5)
        # Clamp
        head_roi = frame[y1:y1+head_h, x1:x2]
        
        if head_roi.size == 0: return False

        # Convert to HSV
        hsv = cv2.cvtColor(head_roi, cv2.COLOR_BGR2HSV)

        # Yellow range (for plastic helmets)
        lower_yellow = np.array([20, 100, 100])
        upper_yellow = np.array([30, 255, 255])
        
        # White range (for white helmets - harder, can confuse with light)
        # Let's stick to yellow detection or high brightness for now
        # lower_white = np.array([0, 0, 200]) 
        # upper_white = np.array([180, 20, 255])

        mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)
        # mask_white = cv2.inRange(hsv, lower_white, upper_white)
        
        # Count non-zero pixels
        yellow_pixels = cv2.countNonZero(mask_yellow)
        total_pixels = head_roi.shape[0] * head_roi.shape[1]
        
        ratio = yellow_pixels / total_pixels if total_pixels > 0 else 0
        
        # Threshold (audit this visually)
        return ratio > 0.05
