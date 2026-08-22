import ctypes
import os

def is_admin() -> bool:
    """Check if the current process has administrator privileges on Windows."""
    if os.name == 'nt':
        try:
            return ctypes.windll.shell32.IsUserAnAdmin() != 0
        except Exception:
            return False
    return False
