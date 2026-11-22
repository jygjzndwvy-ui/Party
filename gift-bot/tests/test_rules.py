import unittest

from giftbot.config import Config
from giftbot.rules import DAY, HOUR, buy_blocker, check_stop_loss, resume, status_line
from giftbot.scanner import Scanner
from giftbot.store import Position, Store

from helpers import FakeApi, lot

T0 = 1_800_000_000


def position(store, title="Plush Pepe #1", opened=T0, closed=None, pnl=None):
    pos = Position(slug=title, gift_id=1, title=title, seg_name="модель", seg_model_id=1, seg_backdrop_id=None,
                   buy_price=5.0, ask=6.0, opened_at=opened, last_reprice_at=opened, last_check_at=opened)
    if closed is not None:
        pos.status, pos.closed_at, pos.close_price, pos.pnl = "closed", closed, 5.0, pnl
    return store.add_position(pos)


class RulesTest(unittest.TestCase):
    def setUp(self):
        self.cfg = Config(bank_ton=10.0)
        self.store = Store(":memory:")

    def test_one_buy_per_day(self):
        position(self.store, opened=T0)
        self.assertIn("в сутки", buy_blocker(self.store, self.cfg, "Snoop Dogg", T0 + HOUR))
        self.assertIsNone(buy_blocker(self.store, self.cfg, "Snoop Dogg", T0 + DAY + 1))

    def test_pause_after_loss(self):
        position(self.store, opened=T0 - 3 * DAY, closed=T0, pnl=-0.4)
        self.assertIn("пауза", buy_blocker(self.store, self.cfg, "Snoop Dogg", T0 + HOUR))
        self.assertIsNone(buy_blocker(self.store, self.cfg, "Snoop Dogg", T0 + DAY + 1))

    def test_collection_pause_after_loss(self):
        position(self.store, title="Plush Pepe #7", opened=T0 - 3 * DAY, closed=T0, pnl=-0.4)
        later = T0 + 2 * DAY
        self.assertIn("Plush Pepe", buy_blocker(self.store, self.cfg, "Plush Pepe", later))
        self.assertIsNone(buy_blocker(self.store, self.cfg, "Snoop Dogg", later))
        self.assertIsNone(buy_blocker(self.store, self.cfg, "Plush Pepe", T0 + 8 * DAY))

    def test_profit_does_not_pause(self):
        position(self.store, opened=T0 - 3 * DAY, closed=T0, pnl=+0.8)
        self.assertIsNone(buy_blocker(self.store, self.cfg, "Plush Pepe", T0 + HOUR))

    def test_stop_loss_halts_until_resume(self):
        position(self.store, title="A #1", opened=T0 - 9 * DAY, closed=T0 - 8 * DAY, pnl=-0.9)
        self.assertIsNone(check_stop_loss(self.store, self.cfg))          # −0.9 из допустимых −1.5
        position(self.store, title="B #2", opened=T0 - 7 * DAY, closed=T0 - 6 * DAY, pnl=-0.7)
        reason = check_stop_loss(self.store, self.cfg)                     # −1.6: стоп
        self.assertIn("-1.60", reason)
        self.assertIn("остановлены", buy_blocker(self.store, self.cfg, "C", T0))
        self.assertIn("/resume", status_line(self.store, self.cfg, T0))
        self.assertIsNone(check_stop_loss(self.store, self.cfg))          # повторно не сообщаем
        resume(self.store)
        self.assertIsNone(buy_blocker(self.store, self.cfg, "C", T0))
        self.assertIsNone(check_stop_loss(self.store, self.cfg))          # отсчёт заново после /resume


class ScannerRulesTest(unittest.IsolatedAsyncioTestCase):
    async def test_halt_blocks_buys_but_signals_still_arrive(self):
        store = Store(":memory:")
        position(store, title="Old #1", opened=T0 - 9 * DAY, closed=T0 - 8 * DAY, pnl=-2.0)
        api = FakeApi([lot("cheap", 5.0), lot("x", 8.0), lot("y", 9.0)])
        scanner = Scanner(api, store, Config(), clock=lambda: T0, log=lambda m: None)
        events = await scanner.cycle()
        self.assertEqual([e.kind for e in events], ["halt", "signal"])
        self.assertEqual(store.positions("open"), [])
        self.assertEqual(scanner.stats.blocked_by_rules, 1)


if __name__ == "__main__":
    unittest.main()
