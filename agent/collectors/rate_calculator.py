from typing import Dict, Optional, Tuple
import time

class RateCalculator:
    def __init__(self):
        # Maps metric_id -> (last_value, last_time)
        self._state: Dict[str, Tuple[float, float]] = {}

    def calculate_rate(self, metric_id: str, current_value: float) -> Optional[float]:
        if current_value is None:
            return None
            
        current_time = time.time()
        
        if metric_id not in self._state:
            self._state[metric_id] = (current_value, current_time)
            return None
            
        last_value, last_time = self._state[metric_id]
        
        elapsed = current_time - last_time
        if elapsed <= 0:
            return None
            
        delta = current_value - last_value
        
        # Handle counter reset or negative delta
        if delta < 0:
            self._state[metric_id] = (current_value, current_time)
            return None
            
        rate = delta / elapsed
        self._state[metric_id] = (current_value, current_time)
        return rate
