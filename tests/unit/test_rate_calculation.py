import unittest
import time
from agent.collectors.rate_calculator import RateCalculator

class TestRateCalculator(unittest.TestCase):

    def test_first_sample_is_none(self):
        calc = RateCalculator()
        self.assertIsNone(calc.calculate_rate("net", 1000.0))

    def test_normal_rate(self):
        calc = RateCalculator()
        calc.calculate_rate("net", 1000.0)
        time.sleep(0.1) # Simulate elapsed time
        rate = calc.calculate_rate("net", 1100.0)
        self.assertIsNotNone(rate)
        self.assertTrue(rate > 0.0)

    def test_negative_delta_is_none(self):
        calc = RateCalculator()
        calc.calculate_rate("net", 1000.0)
        time.sleep(0.1)
        # Simulate counter reset
        rate = calc.calculate_rate("net", 500.0)
        self.assertIsNone(rate)
        
    def test_zero_delta(self):
        calc = RateCalculator()
        calc.calculate_rate("net", 1000.0)
        time.sleep(0.1)
        rate = calc.calculate_rate("net", 1000.0)
        self.assertEqual(rate, 0.0)

if __name__ == '__main__':
    unittest.main()
