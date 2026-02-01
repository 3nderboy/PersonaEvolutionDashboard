"""
Logging utilities for clear, structured console output.
"""

import sys
from datetime import datetime


class Colors:
    """ANSI color codes for terminal output."""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    INFO = "\033[36m"      # Cyan
    SUCCESS = "\033[32m"   # Green
    WARNING = "\033[33m"   # Yellow
    ERROR = "\033[31m"     # Red
    STEP = "\033[35m"      # Magenta
    
    @classmethod
    def disable(cls):
        """Disable colors for terminals without ANSI support."""
        for attr in dir(cls):
            if not attr.startswith("_") and attr != "disable":
                setattr(cls, attr, "")


# Enable ANSI on Windows 10+
if sys.platform == "win32":
    try:
        import os
        os.system("")
    except:
        Colors.disable()


class Logger:
    """Structured logger for script output."""
    
    def __init__(self, script_name: str):
        self.script_name = script_name
        self.start_time = None
    
    def header(self, title: str):
        """Print script header."""
        self.start_time = datetime.now()
        print(f"\n{Colors.BOLD}{Colors.INFO}# {title}{Colors.RESET}\n")
    
    def step(self, number: int, description: str):
        """Print numbered step header."""
        print(f"\n{Colors.STEP}[Step {number}]{Colors.RESET} {Colors.BOLD}{description}{Colors.RESET}")
    
    def info(self, message: str):
        """Print info message."""
        print(f"  {Colors.INFO}>{Colors.RESET} {message}")
    
    def success(self, message: str):
        """Print success message."""
        print(f"  {Colors.SUCCESS}[OK]{Colors.RESET} {message}")
    
    def warning(self, message: str):
        """Print warning message."""
        print(f"  {Colors.WARNING}[WARN]{Colors.RESET} {message}")
    
    def error(self, message: str):
        """Print error message."""
        print(f"  {Colors.ERROR}[ERR]{Colors.RESET} {message}")
    
    def detail(self, label: str, value):
        """Print indented detail line."""
        print(f"    {Colors.DIM}{label}:{Colors.RESET} {value}")
    
    def progress(self, current: int, total: int, item: str = ""):
        """Print progress bar."""
        pct = (current / total * 100) if total > 0 else 0
        bar_len = 30
        filled = int(bar_len * current / total) if total > 0 else 0
        bar = "#" * filled + "-" * (bar_len - filled)
        suffix = f" | {item}" if item else ""
        print(f"\r  [{bar}] {current}/{total} ({pct:.0f}%){suffix}    ", end="", flush=True)
        if current >= total:
            print()
    
    def summary(self, processed: int, skipped: int = 0, errors: int = 0):
        """Print final summary."""
        elapsed = ""
        if self.start_time:
            delta = datetime.now() - self.start_time
            mins, secs = divmod(delta.seconds, 60)
            elapsed = f" ({mins}m {secs}s)" if mins > 0 else f" ({secs}s)"
        
        print(f"\n{Colors.BOLD}{'-' * 60}{Colors.RESET}")
        print(f"  {Colors.SUCCESS}Processed:{Colors.RESET} {processed}{elapsed}")
        if skipped > 0:
            print(f"  {Colors.DIM}Skipped:{Colors.RESET}   {skipped}")
        if errors > 0:
            print(f"  {Colors.ERROR}Errors:{Colors.RESET}    {errors}")
        print()
