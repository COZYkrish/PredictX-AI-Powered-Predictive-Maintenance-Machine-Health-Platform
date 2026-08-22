from typing import Any, Optional

def validate_percent(value: Any) -> Optional[float]:
    """Validates that a percentage is between 0 and 100."""
    try:
        if value is None:
            return None
        val = float(value)
        if 0.0 <= val <= 100.0:
            return val
        return None
    except (ValueError, TypeError):
        return None

def validate_non_negative(value: Any) -> Optional[float]:
    """Validates that a value is non-negative."""
    try:
        if value is None:
            return None
        val = float(value)
        if val >= 0.0:
            return val
        return None
    except (ValueError, TypeError):
        return None
