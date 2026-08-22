import wmi
from typing import List, Dict, Any, Optional

_wmi_cache: Optional[wmi.WMI] = None

def get_wmi() -> wmi.WMI:
    global _wmi_cache
    if _wmi_cache is None:
        _wmi_cache = wmi.WMI()
    return _wmi_cache

def query_cim(namespace: str, query: str) -> List[Any]:
    """
    Queries WMI/CIM using python-wmi.
    Namespace example: 'root\\cimv2'
    """
    try:
        if namespace == "root\\cimv2":
            w = get_wmi()
        else:
            w = wmi.WMI(namespace=namespace)
        return w.query(query)
    except Exception:
        return []
