import time
from typing import Callable
from .logger import logger

class Scheduler:
    def __init__(self, interval_seconds: int):
        if interval_seconds < 1:
            raise ValueError("Minimum allowed collection interval is 1 second")
        self.interval = interval_seconds
        
    def run(self, task: Callable[[], None]):
        logger.info(f"Starting continuous collection with {self.interval}s interval.")
        while True:
            start_time = time.time()
            
            try:
                task()
            except Exception as e:
                logger.error(f"Task failed during continuous collection: {e}")
                
            elapsed = time.time() - start_time
            sleep_time = self.interval - elapsed
            
            if sleep_time > 0:
                time.sleep(sleep_time)
            else:
                logger.warning(f"Collection took {elapsed:.2f}s, which exceeds interval {self.interval}s!")
