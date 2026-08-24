import unittest
import pandas as pd
import numpy as np
from ml.features.temporal_features import generate_temporal_features

class TestFeatures(unittest.TestCase):
    def setUp(self):
        self.data = pd.DataFrame({
            'device_id': ['dev1', 'dev1', 'dev1', 'dev2', 'dev2'],
            'timestamp_utc': pd.to_datetime([
                '2026-08-01 10:00:00',
                '2026-08-01 10:00:10',
                '2026-08-01 10:00:20',
                '2026-08-01 10:00:05',
                '2026-08-01 10:00:15'
            ], utc=True),
            'cpu_usage_percent': [10, 20, 30, 50, 60]
        })

    def test_temporal_features_shape(self):
        df_feat = generate_temporal_features(self.data)
        
        # Check that we didn't lose rows
        self.assertEqual(len(df_feat), 5)
        
        # Check new columns were added
        self.assertIn('delta_cpu_usage_percent', df_feat.columns)
        self.assertIn('cpu_usage_percent_30s_mean', df_feat.columns)

    def test_device_isolation(self):
        df_feat = generate_temporal_features(self.data)
        
        # For dev2, first sample delta should be NaN, not the diff from dev1's last sample
        dev2_first_delta = df_feat[df_feat['device_id'] == 'dev2'].iloc[0]['delta_cpu_usage_percent']
        self.assertTrue(np.isnan(dev2_first_delta))

if __name__ == '__main__':
    unittest.main()
