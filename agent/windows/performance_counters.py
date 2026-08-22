import win32pdh
import time
from typing import Optional, Dict

def query_counter(counter_path: str, retries: int = 2) -> Optional[float]:
    """
    Query a Windows Performance Counter using PDH.
    """
    try:
        hq = win32pdh.OpenQuery()
        hc = win32pdh.AddCounter(hq, counter_path)
        win32pdh.CollectQueryData(hq)
        # Some counters require two samples to calculate a rate
        time.sleep(0.1)
        win32pdh.CollectQueryData(hq)
        type, val = win32pdh.GetFormattedCounterValue(hc, win32pdh.PDH_FMT_DOUBLE)
        win32pdh.CloseQuery(hq)
        return float(val)
    except Exception:
        return None

def check_counter_availability(counter_path: str) -> bool:
    """
    Checks if a counter is available.
    """
    try:
        hq = win32pdh.OpenQuery()
        hc = win32pdh.AddCounter(hq, counter_path)
        win32pdh.CollectQueryData(hq)
        win32pdh.CloseQuery(hq)
        return True
    except Exception:
        return False
