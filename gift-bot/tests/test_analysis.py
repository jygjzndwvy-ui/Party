import unittest

from giftbot.analysis import breakeven, evaluate, number_tags
from giftbot.config import Config
from giftbot.models import Segment

from helpers import BLACK, MODEL_A, MODEL_B, lot


class NumberTagsTest(unittest.TestCase):
    def test_examples_from_article(self):
        self.assertIn("одинаковые цифры", number_tags(7777))
        self.assertNotIn("зеркальный", number_tags(7777))
        self.assertIn("повтор", number_tags(3636))
        self.assertIn("зеркальный", number_tags(1221))
        self.assertIn("круглый", number_tags(1000))
        self.assertIn("круглый", number_tags(5000))
        self.assertIn("лесенка", number_tags(1234))
        self.assertIn("лесенка", number_tags(4321))
        self.assertIn("короткий номер", number_tags(77))

    def test_ordinary_long_number_has_no_tags(self):
        self.assertEqual(number_tags(48213), [])


class BreakevenTest(unittest.TestCase):
    def test_article_example(self):
        # Купил за 10 TON, продаёшь за TON при доле продавца 90%: безубыток 11.11 TON.
        self.assertAlmostEqual(breakeven(10, 0.9), 11.111, places=3)


class EvaluateTest(unittest.TestCase):
    def setUp(self):
        self.cfg = Config()

    def model_segment(self, *listings):
        return Segment("модель Amalgam", MODEL_A.attr_id, None, list(listings))

    def test_cheap_lot_passes(self):
        candidate = lot("c", 5.0)
        ev = evaluate(candidate, [self.model_segment(candidate, lot("x", 8.0), lot("y", 9.0))], self.cfg)
        self.assertTrue(ev.passes, ev.reason)
        self.assertEqual(ev.ref_price, 8.0)
        self.assertAlmostEqual(ev.expected_sale, 7.76)
        self.assertAlmostEqual(ev.expected_profit, 7.76 * 0.9 - 5.0)

    def test_small_discount_is_rejected(self):
        candidate = lot("c", 7.0)
        ev = evaluate(candidate, [self.model_segment(candidate, lot("x", 8.0), lot("y", 9.0))], self.cfg)
        self.assertFalse(ev.passes)
        self.assertIn("запас", ev.reason)

    def test_too_few_comparables(self):
        candidate = lot("c", 5.0)
        ev = evaluate(candidate, [self.model_segment(candidate, lot("x", 8.0))], self.cfg)
        self.assertFalse(ev.passes)
        self.assertIn("мало", ev.reason)

    def test_not_cheapest_in_segment_is_rejected(self):
        candidate = lot("c", 5.0)
        ev = evaluate(candidate, [self.model_segment(candidate, lot("x", 4.0), lot("y", 9.0))], self.cfg)
        self.assertFalse(ev.passes)

    def test_over_budget(self):
        candidate = lot("c", 9.0)
        ev = evaluate(candidate, [self.model_segment(candidate, lot("x", 20.0), lot("y", 21.0))], self.cfg)
        self.assertFalse(ev.passes)
        self.assertIn("лимита", ev.reason)

    def test_premium_backdrop_uses_highest_reference(self):
        candidate = lot("c", 5.0, backdrop=BLACK)
        by_model = self.model_segment(candidate, lot("x", 5.5), lot("y", 6.0))
        combo = Segment("модель Amalgam + фон Black", MODEL_A.attr_id, BLACK.attr_id,
                        [candidate, lot("p", 12.0, backdrop=BLACK), lot("q", 13.0, backdrop=BLACK)])
        ev = evaluate(candidate, [by_model, combo], self.cfg)
        self.assertTrue(ev.passes, ev.reason)
        self.assertEqual(ev.ref_price, 12.0)
        self.assertIs(ev.segment, combo)
        self.assertIn("фон Black", ev.tags)

    def test_missing_ton_price(self):
        ev = evaluate(lot("c", None, model=MODEL_B), [], self.cfg)
        self.assertFalse(ev.passes)


if __name__ == "__main__":
    unittest.main()
