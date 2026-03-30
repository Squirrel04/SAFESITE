import cv2
import os
import time
import json
import threading
from ultralytics import YOLO

class HybridVisionLLM:
    """Asynchronous background processor to evaluate complex semantic scenes via Vision LLM"""
    def __init__(self):
        self.enabled = False
        self.last_results = []
        self.last_process_time = 0
        self.is_processing = False
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        
        if self.api_key:
            try:
                import google.generativeai as genai
                genai.configure(api_key=self.api_key)
                # Using Gemini 1.5 Flash as it is extremely fast and natively understands bounding box coordinates
                self.model = genai.GenerativeModel("gemini-1.5-flash", generation_config={"response_mime_type": "application/json"})
                self.enabled = True
                print("Vision LLM Hybrid Mode Enabled (Gemini).")
            except Exception as e:
                print(f"Failed to initialize Vision LLM: {e}")

    def analyze_async(self, frame_bgr):
        # Throttle Vision LLM API to max 1 request every 1.0 seconds for higher semantic density
        if not self.enabled or self.is_processing or (time.time() - self.last_process_time < 1.0):
            return

        self.is_processing = True
        
        # Copy to avoid thread race conditions
        frame_copy = frame_bgr.copy()
        
        def run_inference():
            try:
                from PIL import Image
                img_rgb = cv2.cvtColor(frame_copy, cv2.COLOR_BGR2RGB)
                pil_img = Image.fromarray(img_rgb)
                
                # Instruction tailored to return bounding boxes in [ymin, xmin, ymax, xmax] format (0-1000 scale)
                prompt = (
                    "You are a strict industrial safety AI monitoring a live CCTV feed. "
                    "Analyze the scene carefully for the following critical violations: "
                    "1. Missing PPE (Helmet, Vest, Harness). "
                    "2. Unauthorized Zone: Person within restricted red-taped areas, technical rooms, or fenced construction zones without authorization. "
                    "3. Unsafe activity: Smoking, Cell Phone/Headphone usage in active vehicle zones. "
                    "4. Fall Risks: Person near unprotected edges, climbing without harness, or leaning on weak barriers. "
                    "5. Danger Zone: Person near active excavator buckets, under heavy suspended loads, or within the swing radius of moving machinery. (CRITICAL) "
                    "6. Health/Emergency: A person lying on the floor (potential fall/injury/unresponsive). "
                    "7. Fire/Smoke: Large plumes signifying fire (distinguish from dust). "
                    "If you detect any violations, output them as a strict JSON list of objects. "
                    "Each object MUST have: "
                    "\"label\": A concise string like 'Smoking', 'Phone Usage', 'Fall Risk', 'Danger Zone Alert', 'No Helmet', 'Injury Risk', 'Fire'. "
                    "\"confidence\": A float between 0.0 and 1.0. "
                    "\"reasoning\": A one-sentence technical explanation (e.g. 'Worker is within the exclusion zone of an active excavator bucket'). "
                    "\"recommendation\": A short remedial action (e.g. 'Stop heavy machinery immediately and clear the exclusion zone'). "
                    "\"box_2d\": [ymin, xmin, ymax, xmax] scaled 0 to 1000. "
                    "If everything is safe, return []."
                )
                
                response = self.model.generate_content([prompt, pil_img])
                results = json.loads(response.text)
                
                validated = []
                for r in results:
                    if 'label' in r and 'confidence' in r and 'box_2d' in r:
                        # Ensure reasoning exists
                        if 'reasoning' not in r: r['reasoning'] = f"Semantic anomaly detected in {r['label']} pattern."
                        validated.append(r)
                
                self.last_results = validated
                self.last_process_time = time.time()
            except Exception as e:
                pass # Silent fail to prevent stream crash on API rate limits / json parse errors
            finally:
                self.is_processing = False

        threading.Thread(target=run_inference, daemon=True).start()

class PPE_Detector:
    def __init__(self, model_path="safe.pt"):
        print(f"Loading Base User Trained YOLO ML Model: {model_path}")
        self.yolo_model = YOLO(model_path)
        self.muted_labels = []
        
        # Initialize Hybrid VLM
        self.vision_llm = HybridVisionLLM()
            
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

        return intersection_area / denominator

    def detect(self, frame):
        detections = []
        persons = []
        ppe_boxes = []
        other_boxes = []

        h_frame, w_frame = frame.shape[:2]

        # 1. RUN UNIFIED MACHINE LEARNING YOLO PREDICTION (Optimized for 416 resolution for 6x speed)
        results = self.yolo_model(frame, verbose=False, imgsz=416)
        for result in results:
            for box in result.boxes:
                conf = float(box.conf[0])
                xyxy = box.xyxy[0].tolist()
                label = self.yolo_model.names[int(box.cls[0])].lower()
                
                if label == 'person' and conf > 0.4:
                    persons.append({"box": xyxy, "conf": conf, "label": "person"})
                elif any(word in label for word in ['helmet', 'hardhat', 'vest', 'harness', 'belt']) and conf > 0.2:
                    # Use lower threshold for safety gear to ensure we don't miss any subtle marks
                    ppe_boxes.append({"label": label, "box": xyxy, "conf": conf})
                elif conf > 0.35:
                    other_boxes.append({"label": label, "box": xyxy, "conf": conf})

        # Process standard ML logic (YOLO)
        for p in persons:
            xyxy = p["box"]
            x1, y1, x2, y2 = map(int, xyxy)
            w, h = x2 - x1, y2 - y1
            
            has_helmet = any(("helmet" in b["label"] or "hardhat" in b["label"]) and self.calculate_iou(xyxy, b["box"]) > 0.1 for b in ppe_boxes)
            has_vest = any("vest" in b["label"] and self.calculate_iou(xyxy, b["box"]) > 0.1 for b in ppe_boxes)
            has_harness = any(("harness" in b["label"] or "belt" in b["label"]) and self.calculate_iou(xyxy, b["box"]) > 0.1 for b in ppe_boxes)

            missing = []
            if not has_helmet: missing.append("Helmet")
            if not has_vest: missing.append("Vest")
            
            # Special case: If user wants ladder workers with harness to be 'Safe' (or less strictly penalized)
            if has_harness and not has_helmet: 
                # If they have a harness, it marks them as height-safe
                harness_bonus = True 
            else:
                harness_bonus = False

            status, final_label, color = "safe", "Safe: Full PPE", (0, 255, 0)
            
            if missing:
                if harness_bonus and missing == ["Helmet"]:
                    final_label = "Safe: Harness Secured"
                    status, color = "safe", (0, 255, 0)
                else:
                    final_label = f"Violation: No {', '.join(missing)}"
                    status, color = "violation", (0, 0, 255)
            
            # Additional safety tag if they have everything + harness
            if not missing and has_harness:
                final_label = "Safe: Max PPE (+Harness)"

            yolo_person_conf = p["conf"]
            detections.append({"label": final_label, "confidence": yolo_person_conf, "box": [int(v) for v in xyxy], "status": status, "source": "YOLO"})

        # Pass non-person items visually
        for obj in ppe_boxes + other_boxes:
            if obj["label"] in ['hardhat', 'helmet', 'vest', 'person']:
                continue 
            status = "safe" if obj["label"] in ['machinery', 'excavator'] else "violation"
            color = (255, 165, 0) if status == "safe" else (0, 165, 255)
            detections.append({"label": f"Alert: {obj['label'].title()}", "confidence": obj["conf"], "box": [int(v) for v in obj["box"]], "status": status, "source": "YOLO"})

        # 2. RUN HYBRID VISION LLM (Semantic reasoning background pass)
        self.vision_llm.analyze_async(frame)
        
        # 3. MERGE LOGIC (Highest probable correct answer wins)
        # Use LLM bounding boxes mapped back to frame resolution
        if self.vision_llm.last_results:
            for llm_violation in self.vision_llm.last_results:
                v_label = llm_violation['label']
                v_conf = llm_violation['confidence']
                ymin, xmin, ymax, xmax = llm_violation['box_2d']
                
                # Convert 0-1000 scale to frame pixels
                v_box = [
                    int((xmin / 1000.0) * w_frame),
                    int((ymin / 1000.0) * h_frame),
                    int((xmax / 1000.0) * w_frame),
                    int((ymax / 1000.0) * h_frame)
                ]
                
                v_status = "violation"
                
                # Hybrid Override Logic
                overlap_found = False
                for d in detections:
                    iou = self.calculate_iou(d["box"], v_box)
                    if iou > 0.3:
                        overlap_found = True
                        # If LLM has higher confidence or recognizes a semantic threat YOLO cannot natively categorize
                        if v_conf > d["confidence"] or any(threat in v_label.lower() for threat in ['smoke', 'phone', 'hazard', 'fall', 'fire', 'injury', 'unresponsive', 'collapse', 'danger', 'exclusion']):
                            if d["status"] == "safe" or v_conf > d["confidence"]:
                                d["label"] = f"LLM Flag: {v_label}"
                                d["confidence"] = v_conf
                                d["status"] = "violation"
                                d["reasoning"] = v.get("reasoning")
                                d["recommendation"] = v.get("recommendation")
                                d["color"] = (255, 0, 255) # Magenta for LLM override
                
                # If LLM found a violation YOLO totally missed, append it natively
                if not overlap_found and v_conf > 0.4:
                    detections.append({
                        "label": f"VLM Alert: {v_label}",
                        "confidence": v_conf,
                        "box": v_box,
                        "status": "violation",
                        "reasoning": v.get("reasoning"),
                        "recommendation": v.get("recommendation"),
                        "color": (255, 0, 255)
                    })
        
        # 4. FINAL RENDER
        final_detections = []
        for d in detections:
            if d["label"] in self.muted_labels: continue
            final_detections.append(d)
            
            x1, y1, x2, y2 = map(int, d["box"])
            color = d.get("color", (0, 0, 255) if d["status"] == "violation" else (0, 255, 0))
            
            # Draw standard box
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, 2)
            
            # Add dynamic source/confidence badge
            display_text = f"{d['label']} {d['confidence']:.2f}"
            cv2.putText(frame, display_text, (x1, max(y1 - 10, 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, color, 1, cv2.LINE_AA)

        return final_detections, frame
