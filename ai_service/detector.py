import cv2
import os
import time
import json
import threading
from ultralytics import YOLO

# ─────────────────────────────────────────────────────────────────────────────
# COLOR CONSTANTS  (BGR format for OpenCV)
# ─────────────────────────────────────────────────────────────────────────────
COLOR_SAFE      = (0, 200, 0)       # Green   — Safe / Full PPE
COLOR_PPE       = (0, 0, 220)       # Red     — PPE violation (No helmet / vest)
COLOR_ZONE      = (220, 0, 220)     # Violet  — Danger Zone / Unauthorized Zone ONLY
COLOR_OTHER     = (0, 140, 255)     # Orange  — Other semantic alerts (smoke, phone, etc.)
COLOR_WARNING   = (0, 165, 255)     # Amber   — Zone detected but no person inside

# ─────────────────────────────────────────────────────────────────────────────
# LABEL CLASSIFICATION HELPERS
# ─────────────────────────────────────────────────────────────────────────────
ZONE_KEYWORDS = [
    'danger zone', 'unauthorized zone', 'restricted zone', 'exclusion zone',
    'danger', 'unauthorized', 'restricted', 'exclusion', 'boundary breach',
    'zone violation', 'zone alert', 'zone'
]

PPE_KEYWORDS = [
    'no helmet', 'no vest', 'no harness', 'missing helmet', 'missing vest',
    'missing ppe', 'no ppe', 'ppe violation', 'helmet', 'vest', 'harness'
]

def classify_grok_label(label: str):
    """
    Returns (violation_type, color) for a Grok-detected label.
    Violet is STRICTLY reserved for zone/unauthorized violations only.
    """
    label_lower = label.lower()

    # Zone check first — these get VIOLET
    if any(k in label_lower for k in ZONE_KEYWORDS):
        return "zone", COLOR_ZONE

    # PPE check — these get RED
    if any(k in label_lower for k in PPE_KEYWORDS):
        return "ppe", COLOR_PPE

    # Everything else (smoke, phone, fire, fall risk, injury) — ORANGE
    return "other", COLOR_OTHER


# ─────────────────────────────────────────────────────────────────────────────
# HYBRID VISION LLM  (Grok-2 Vision — fully async, never blocks stream)
# ─────────────────────────────────────────────────────────────────────────────
class HybridVisionLLM:
    """
    Asynchronous Grok-2 Vision processor.
    Runs in a daemon thread — the video stream is NEVER blocked by this.
    Throttled to 1 API call per 2 seconds to stay within rate limits.
    """
    def __init__(self):
        self.enabled      = False
        self.last_results = []          # latest parsed violations from Grok
        self.last_process_time = 0
        self.is_processing = False
        self.lock = threading.Lock()    # protect last_results from race conditions
        self.api_key = os.getenv("GROK_API_KEY", "")
        self.client  = None

        if self.api_key:
            try:
                from openai import OpenAI
                self.client = OpenAI(
                    api_key=self.api_key,
                    base_url="https://api.x.ai/v1",
                )
                self.model_name = "grok-2-vision-1212"
                self.enabled = True
                print("Vision LLM Hybrid Mode Enabled (Grok-2 Vision via xAI).")
            except Exception as e:
                print(f"Failed to initialize Grok Vision LLM: {e}")

    def analyze_async(self, frame_bgr):
        """
        Fire-and-forget: submits a frame to Grok in a background daemon thread.
        Returns immediately — never delays the caller.
        """
        # Throttle: skip if another call is in-flight or too soon
        if not self.enabled or self.is_processing:
            return
        if time.time() - self.last_process_time < 2.0:
            return

        self.is_processing = True
        frame_copy = frame_bgr.copy()   # snapshot to avoid frame mutation

        def run_inference():
            try:
                import base64
                # Downscale to 640x360 before sending — reduces token cost and latency
                small = cv2.resize(frame_copy, (640, 360))
                _, buf = cv2.imencode('.jpg', small, [cv2.IMWRITE_JPEG_QUALITY, 80])
                img_b64 = base64.b64encode(buf).decode('utf-8')

                prompt = (
                    "You are a strict industrial safety AI monitoring a live CCTV feed on a construction site. "
                    "Analyze the scene for ALL of the following violations:\n\n"
                    "PPE VIOLATIONS (label MUST start with 'No ' or 'Missing '):\n"
                    "  - No Helmet: person not wearing a hard hat\n"
                    "  - No Vest: person not wearing a high-visibility vest\n"
                    "  - No Harness: person at height without fall harness\n\n"
                    "ZONE VIOLATIONS (label MUST contain 'Zone' or 'Unauthorized'):\n"
                    "  - Danger Zone: person within swing radius of machinery, under suspended load, near excavator\n"
                    "  - Unauthorized Zone: person inside restricted/red-taped/fenced area\n"
                    "  - Exclusion Zone: person inside a defined exclusion boundary\n\n"
                    "OTHER VIOLATIONS:\n"
                    "  - Smoking: person smoking on site\n"
                    "  - Phone Usage: person using phone/headphones in active vehicle zone\n"
                    "  - Fall Risk: person near unprotected edge or climbing without harness\n"
                    "  - Injury Risk: person lying on floor (unresponsive/fallen)\n"
                    "  - Fire: visible fire or large smoke plume\n\n"
                    "RULES:\n"
                    "  - Only report ACTUAL violations you can clearly see. Do NOT hallucinate.\n"
                    "  - If the scene is safe, respond with exactly: []\n"
                    "  - Each violation object MUST have these exact keys:\n"
                    "      \"label\": short string (use category names above)\n"
                    "      \"confidence\": float 0.0-1.0\n"
                    "      \"reasoning\": one technical sentence explaining what you see\n"
                    "      \"recommendation\": one short remedial action\n"
                    "      \"box_2d\": [ymin, xmin, ymax, xmax] scaled 0-1000 around the violating person/object\n"
                    "Respond ONLY with a valid JSON array. No markdown, no extra text."
                )

                response = self.client.chat.completions.create(
                    model=self.model_name,
                    messages=[{
                        "role": "user",
                        "content": [
                            {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{img_b64}", "detail": "low"}},
                            {"type": "text", "text": prompt}
                        ]
                    }],
                    max_tokens=1024,
                    temperature=0.1,   # low temperature = consistent structured output
                )

                raw = response.choices[0].message.content.strip()

                # Strip markdown code fences if present
                if raw.startswith("```"):
                    raw = raw.split("```")[1]
                    if raw.startswith("json"):
                        raw = raw[4:].strip()

                results = json.loads(raw)
                validated = []
                for r in results:
                    if 'label' in r and 'confidence' in r and 'box_2d' in r:
                        r.setdefault('reasoning', f"Semantic anomaly: {r['label']}")
                        r.setdefault('recommendation', "Alert supervisor immediately.")
                        validated.append(r)

                with self.lock:
                    self.last_results = validated

                self.last_process_time = time.time()
                if validated:
                    print(f"[Grok] Detected {len(validated)} violation(s): {[v['label'] for v in validated]}")
                else:
                    print(f"[Grok] Scene assessed as safe.")

            except json.JSONDecodeError as e:
                print(f"[Grok] JSON parse error: {e}")
            except Exception as e:
                print(f"[Grok] Inference error: {e}")
            finally:
                self.is_processing = False

        threading.Thread(target=run_inference, daemon=True).start()

    def get_results(self):
        """Thread-safe read of latest Grok results."""
        with self.lock:
            return list(self.last_results)


# ─────────────────────────────────────────────────────────────────────────────
# MAIN DETECTOR
# ─────────────────────────────────────────────────────────────────────────────
class PPE_Detector:
    def __init__(self, model_path="safe.pt"):
        print(f"Loading Base User Trained YOLO ML Model: {model_path}")
        self.yolo_model  = YOLO(model_path)
        self.muted_labels = []
        self.vision_llm  = HybridVisionLLM()

    def calculate_iou(self, box1, box2):
        x_left   = max(box1[0], box2[0])
        y_top    = max(box1[1], box2[1])
        x_right  = min(box1[2], box2[2])
        y_bottom = min(box1[3], box2[3])

        if x_right < x_left or y_bottom < y_top:
            return 0.0

        inter = (x_right - x_left) * (y_bottom - y_top)
        denom = min(
            (box1[2] - box1[0]) * (box1[3] - box1[1]),
            (box2[2] - box2[0]) * (box2[3] - box2[1])
        )
        return inter / denom if denom > 0 else 0.0

    def detect(self, frame, camera_id="01"):
        detections = []
        persons    = []
        ppe_boxes  = []
        other_boxes = []

        h_frame, w_frame = frame.shape[:2]

        # ── STAGE 1: YOLO INFERENCE ──────────────────────────────────────────
        results = self.yolo_model(frame, verbose=False, imgsz=416)
        for result in results:
            for box in result.boxes:
                conf  = float(box.conf[0])
                xyxy  = box.xyxy[0].tolist()
                label = self.yolo_model.names[int(box.cls[0])].lower()

                if label == 'person' and conf > 0.4:
                    persons.append({"box": xyxy, "conf": conf, "label": "person"})
                elif any(w in label for w in ['helmet', 'hardhat', 'vest', 'harness', 'belt']) and conf > 0.2:
                    ppe_boxes.append({"label": label, "box": xyxy, "conf": conf})
                elif conf > 0.35:
                    other_boxes.append({"label": label, "box": xyxy, "conf": conf})

        # ── STAGE 2: PPE COMPLIANCE PER PERSON ───────────────────────────────
        for p in persons:
            xyxy = p["box"]

            has_helmet  = any(
                ("helmet" in b["label"] or "hardhat" in b["label"])
                and self.calculate_iou(xyxy, b["box"]) > 0.1
                for b in ppe_boxes
            )
            has_vest    = any("vest" in b["label"] and self.calculate_iou(xyxy, b["box"]) > 0.1 for b in ppe_boxes)
            has_harness = any(
                ("harness" in b["label"] or "belt" in b["label"])
                and self.calculate_iou(xyxy, b["box"]) > 0.1
                for b in ppe_boxes
            )

            missing = []
            if not has_helmet: missing.append("Helmet")
            if not has_vest:   missing.append("Vest")

            if not missing:
                label_out  = "Safe: Max PPE (+Harness)" if has_harness else "Safe: Full PPE"
                status     = "safe"
                color      = COLOR_SAFE
                vtype      = "none"
            else:
                label_out  = f"Violation: No {', '.join(missing)}"
                status     = "violation"
                color      = COLOR_PPE       # ← RED for PPE, never violet
                vtype      = "ppe"

            detections.append({
                "label":          label_out,
                "confidence":     p["conf"],
                "box":            [int(v) for v in xyxy],
                "status":         status,
                "source":         "YOLO",
                "violation_type": vtype,
                "color":          color,
            })

        # ── STAGE 3: DANGER ZONE DETECTION (YOLO object proximity) ───────────
        for obj in ppe_boxes + other_boxes:
            if obj["label"] in ['hardhat', 'helmet', 'vest', 'person']:
                continue

            is_zone = obj["label"] in ['machinery', 'excavator']

            if is_zone:
                bx1, by1, bx2, by2 = obj["box"]
                bw, bh = bx2 - bx1, by2 - by1
                margin_box = [
                    max(0, bx1 - bw * 0.25),
                    max(0, by1 - bh * 0.25),
                    min(w_frame, bx2 + bw * 0.25),
                    min(h_frame, by2 + bh * 0.25),
                ]
                
                zone_has_person = False
                for p in persons:
                    if self.calculate_iou(p["box"], margin_box) > 0.01:
                        zone_has_person = True
                        detections.append({
                            "label":          f"Danger Zone: {obj['label'].title()}",
                            "confidence":     obj["conf"],
                            "box":            [int(v) for v in p["box"]],  # Same as person box
                            "status":         "violation",
                            "source":         "YOLO",
                            "violation_type": "zone",
                            "color":          COLOR_ZONE,
                        })
                
                if not zone_has_person:
                    detections.append({
                        "label":          f"Zone: {obj['label'].title()}",
                        "confidence":     obj["conf"],
                        "box":            [int(v) for v in margin_box],  # 25% large box
                        "status":         "warning",
                        "source":         "YOLO",
                        "violation_type": "none",
                        "color":          COLOR_OTHER,  # Orange warning
                    })
            else:
                has_person = any(self.calculate_iou(p["box"], obj["box"]) > 0.05 for p in persons)
                detections.append({
                    "label":          f"Alert: {obj['label'].title()}",
                    "confidence":     obj["conf"],
                    "box":            [int(v) for v in obj["box"]],
                    "status":         "violation",
                    "source":         "YOLO",
                    "violation_type": "other",
                    "color":          COLOR_OTHER,
                })

        # ── STAGE 3.5: STATIC DANGER ZONE INTERSECTION (Camera 01) ───────────
        import numpy as np
        if camera_id == "01":
            # Danger Zone in normalized coordinates: bottom-left quadrant
            dz_xmin, dz_ymin, dz_xmax, dz_ymax = 0.0, 0.40, 0.45, 1.0
            
            # Let's draw the virtual boundary on the frame
            pts = np.array([
                [dz_xmin * w_frame, dz_ymin * h_frame],
                [dz_xmax * w_frame, dz_ymin * h_frame],
                [dz_xmax * w_frame, dz_ymax * h_frame],
                [dz_xmin * w_frame, dz_ymax * h_frame]
            ], dtype=np.int32)
            
            # 1. Semi-transparent filled overlay (5% opacity)
            try:
                overlay = frame.copy()
                cv2.fillPoly(overlay, [pts], COLOR_ZONE)
                cv2.addWeighted(overlay, 0.05, frame, 0.95, 0, frame)
            except Exception:
                pass
                
            # 2. Draw solid boundary border
            cv2.polylines(frame, [pts], isClosed=True, color=COLOR_ZONE, thickness=2, lineType=cv2.LINE_AA)
            
            # 3. Text label for the zone
            label_x = int(0.01 * w_frame)
            label_y = int(dz_ymin * h_frame - 8)
            if label_y < 12: label_y = 12
            cv2.putText(frame, "DANGER ZONE: CAMERA 01 (RESTRICTED AREA)", (label_x, label_y), cv2.FONT_HERSHEY_SIMPLEX, 0.42, COLOR_ZONE, 1, cv2.LINE_AA)
            
            # 4. Check person overlap
            for p in persons:
                px1, py1, px2, py2 = p["box"]
                # Normalize person coordinates
                px1_n, py1_n, px2_n, py2_n = px1 / w_frame, py1 / h_frame, px2 / w_frame, py2 / h_frame
                
                # Compute intersection
                ix1 = max(px1_n, dz_xmin)
                iy1 = max(py1_n, dz_ymin)
                ix2 = min(px2_n, dz_xmax)
                iy2 = min(py2_n, dz_ymax)
                
                if ix2 > ix1 and iy2 > iy1:
                    inter_area = (ix2 - ix1) * (iy2 - iy1)
                    person_area = (px2_n - px1_n) * (py2_n - py1_n)
                    overlap = inter_area / person_area if person_area > 0 else 0.0
                    
                    if overlap > 0.15:
                        detections.append({
                            "label":          "Danger Zone: Unauthorized Entry",
                            "confidence":     p["conf"],
                            "box":            [int(v) for v in p["box"]],
                            "status":         "violation",
                            "source":         "YOLO",
                            "violation_type": "zone",
                            "color":          COLOR_ZONE,
                            "reasoning":      "Worker entered the designated heavy machinery hazard zone.",
                            "recommendation": "Evacuate the restricted area immediately."
                        })

        # ── STAGE 4: TRIGGER GROK ASYNC (fire-and-forget, never blocks) ──────
        self.vision_llm.analyze_async(frame)

        # ── STAGE 5: MERGE GROK RESULTS ──────────────────────────────────────
        # Read last available Grok results (thread-safe snapshot)
        grok_results = self.vision_llm.get_results()

        for gv in grok_results:
            v_label = gv['label']
            v_conf  = gv['confidence']
            ymin, xmin, ymax, xmax = gv['box_2d']

            # Convert 0-1000 normalized coords → actual pixel coords
            v_box = [
                int((xmin / 1000.0) * w_frame),
                int((ymin / 1000.0) * h_frame),
                int((xmax / 1000.0) * w_frame),
                int((ymax / 1000.0) * h_frame),
            ]

            # Classify label to get correct violation_type and color
            v_type, v_color = classify_grok_label(v_label)

            # Grok PPE → RED,  Grok Zone → VIOLET,  Grok Other → ORANGE
            # Color is determined entirely by v_type — never bleeds across categories
            v_status = "violation" if v_type in ("ppe", "zone", "other") else "safe"

            # Try to merge with an existing YOLO detection in the same area
            merged = False
            for d in detections:
                iou = self.calculate_iou(d["box"], v_box)
                if iou > 0.25:
                    merged = True
                    # Only upgrade: if Grok is more confident OR catches semantic threat YOLO missed
                    if v_conf > d["confidence"] or d["status"] == "safe":
                        d["label"]          = f"[Grok] {v_label}"
                        d["confidence"]     = v_conf
                        d["status"]         = v_status
                        d["source"]         = "LLM+YOLO"
                        d["violation_type"] = v_type
                        d["color"]          = v_color   # ← color comes from classify_grok_label
                        d["reasoning"]      = gv.get("reasoning")
                        d["recommendation"] = gv.get("recommendation")
                    break

            # If no overlapping YOLO detection, add Grok detection as new box
            if not merged and v_conf > 0.4:
                detections.append({
                    "label":          f"[Grok] {v_label}",
                    "confidence":     v_conf,
                    "box":            v_box,
                    "status":         v_status,
                    "violation_type": v_type,
                    "source":         "LLM",
                    "reasoning":      gv.get("reasoning"),
                    "recommendation": gv.get("recommendation"),
                    "color":          v_color,   # ← VIOLET only if zone, RED if ppe, ORANGE if other
                })

        # ── STAGE 6: RENDER BOXES ONTO FRAME ─────────────────────────────────
        final_detections = []
        for d in detections:
            if d["label"] in self.muted_labels:
                continue
            final_detections.append(d)

            x1, y1, x2, y2 = map(int, d["box"])
            color = d.get("color", COLOR_PPE if d["status"] == "violation" else COLOR_SAFE)

            # Box border — thicker for violations
            thickness = 2 if d["status"] == "safe" else 3
            cv2.rectangle(frame, (x1, y1), (x2, y2), color, thickness)

            # Label background pill
            label_text = f"{d['label']} {d['confidence']:.2f}"
            (tw, th), _ = cv2.getTextSize(label_text, cv2.FONT_HERSHEY_SIMPLEX, 0.42, 1)
            ty = max(y1 - 12, 12)
            cv2.rectangle(frame, (x1, ty - th - 3), (x1 + tw + 4, ty + 2), color, -1)
            cv2.putText(frame, label_text, (x1 + 2, ty), cv2.FONT_HERSHEY_SIMPLEX, 0.42, (255, 255, 255), 1, cv2.LINE_AA)

        return final_detections, frame
