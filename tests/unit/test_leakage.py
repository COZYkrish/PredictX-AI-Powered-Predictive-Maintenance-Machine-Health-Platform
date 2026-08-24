import unittest
import pandas as pd
from ml.data.splitter import time_based_split

class TestLeakage(unittest.TestCase):
    def setUp(self):
        # 10 samples ordered by time
        self.data = pd.DataFrame({
            'device_id': ['dev1'] * 10,
            'timestamp_utc': pd.to_datetime([f'2026-08-01 10:00:{i:02d}' for i in range(10)], utc=True),
            'value': range(10)
        })
        
    def test_time_split_leakage(self):
        # 70% train (7), 15% val (1), 15% test (2)
        train, val, test = time_based_split(self.data, train_frac=0.7, val_frac=0.15)
        
        self.assertEqual(len(train), 7)
        self.assertEqual(len(val), 1)
        self.assertEqual(len(test), 2)
        
        # Train timestamps must be strictly less than val
        self.assertTrue(train['timestamp_utc'].max() < val['timestamp_utc'].min())
        
        # Val timestamps must be strictly less than test
        self.assertTrue(val['timestamp_utc'].max() < test['timestamp_utc'].min())
        
if __name__ == '__main__':
    unittest.main()
