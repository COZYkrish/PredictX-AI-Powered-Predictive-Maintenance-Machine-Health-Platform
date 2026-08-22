from dataclasses import dataclass, field
from typing import Dict, Any, List

@dataclass
class CollectorResult:
    status: str = "success"  # success, partial, unavailable, error, not_applicable
    data: Dict[str, Any] = field(default_factory=dict)
    warnings: List[str] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    duration_ms: float = 0.0

class BaseCollector:
    name: str = "base"
    
    def check_capability(self) -> Dict[str, Any]:
        """
        Returns a dictionary mapping metric_names to availability info.
        Example: {'cpu_usage_percent': {'available': True, 'reason': '', 'source': 'psutil'}}
        """
        return {}

    def collect(self) -> CollectorResult:
        """
        Performs collection and returns a CollectorResult.
        """
        raise NotImplementedError
