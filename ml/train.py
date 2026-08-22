import argparse
import logging
from .data.dataset_builder import build_dataset
from .training.trainer import train_pipeline

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def main():
    parser = argparse.ArgumentParser(description="Train PredictX ML Models")
    parser.add_argument("--dataset", type=str, default="data/predictx.db", help="Path to telemetry dataset")
    parser.add_argument("--target", type=str, default="proxy_health_label", help="Target column to predict")
    
    args = parser.parse_args()
    
    logger.info(f"Building dataset from {args.dataset}")
    df = build_dataset(args.dataset)
    
    if df.empty:
        logger.error("Dataset is empty after building. Aborting training.")
        return
        
    logger.info("Starting training pipeline.")
    train_pipeline(df, target_col=args.target)
    
if __name__ == "__main__":
    main()
