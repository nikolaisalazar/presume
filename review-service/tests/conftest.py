import sys
from pathlib import Path


REVIEW_SERVICE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REVIEW_SERVICE_ROOT))
