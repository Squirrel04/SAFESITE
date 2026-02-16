from ultralytics import YOLO
import os

def train_model():
    # Load a model
    model = YOLO('yolov8n.pt')  # load a pretrained model (recommended for training)

    # Train the model
    # data.yaml path should be absolute or relative to where command is run
    data_path = os.path.abspath("dataset/data.yaml")
    
    print(f"Starting training with config: {data_path}")
    
    results = model.train(
        data=data_path,
        epochs=50,
        imgsz=640,
        batch=16,
        name='yolov8n_custom',
        device='cpu' # Use '0' for GPU if available, 'cpu' otherwise. SafeSite dev env might not have GPU setup.
    )

    print("Training complete.")

if __name__ == '__main__':
    train_model()
