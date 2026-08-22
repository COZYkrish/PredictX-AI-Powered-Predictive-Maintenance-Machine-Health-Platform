import unittest
from agent.utils.validation import validate_percent, validate_non_negative

class TestValidation(unittest.TestCase):

    def test_validate_percent_valid(self):
        self.assertEqual(validate_percent(50.0), 50.0)
        self.assertEqual(validate_percent(0.0), 0.0)
        self.assertEqual(validate_percent(100.0), 100.0)

    def test_validate_percent_invalid(self):
        self.assertIsNone(validate_percent(-1.0))
        self.assertIsNone(validate_percent(100.1))
        self.assertIsNone(validate_percent("abc"))
        self.assertIsNone(validate_percent(None))

    def test_validate_non_negative(self):
        self.assertEqual(validate_non_negative(0.0), 0.0)
        self.assertEqual(validate_non_negative(10.5), 10.5)
        self.assertIsNone(validate_non_negative(-5.0))
        self.assertIsNone(validate_non_negative(None))
        self.assertIsNone(validate_non_negative("def"))

if __name__ == '__main__':
    unittest.main()
