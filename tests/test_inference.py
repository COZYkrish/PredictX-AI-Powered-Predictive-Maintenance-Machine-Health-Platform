import unittest
from ml.inference.health_score import calculate_health_score

class TestInference(unittest.TestCase):
    def test_health_score(self):
        # Normal
        pred = {"risk_level": "LOW", "probability": 0.1}
        score = calculate_health_score(pred, None)
        self.assertEqual(score, 100)
        
        # Medium Risk
        pred = {"risk_level": "MEDIUM", "probability": 0.5}
        score = calculate_health_score(pred, None)
        self.assertEqual(score, 90) # 100 - (20 * 0.5)
        
        # High Risk + Anomaly
        pred = {"risk_level": "HIGH", "probability": 0.8}
        anom = {"anomaly_label": "YES"}
        score = calculate_health_score(pred, anom)
        self.assertEqual(score, 48) # 100 - (40 * 0.8 = 32) - 20 = 48

        # Critical + Bounds
        pred = {"risk_level": "CRITICAL", "probability": 1.0}
        anom = {"anomaly_label": "YES"}
        score = calculate_health_score(pred, anom)
        # 100 - 60 - 20 = 20
        self.assertEqual(score, 20)

if __name__ == '__main__':
    unittest.main()
