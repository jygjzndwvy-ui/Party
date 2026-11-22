import unittest

from giftbot.config import Config
from giftbot.scanner import Scanner
from giftbot.store import Store

from helpers import MODEL_B, FakeApi, lot

T0 = 1_800_000_000


class Clock:
    def __init__(self, t):
        self.t = t

    def __call__(self):
        return self.t


class ScannerTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.api = FakeApi([
            lot("cheap", 5.0), lot("x", 8.0), lot("y", 9.0),
            # другая модель: скидки нет, сигнала быть не должно
            lot("b1", 6.0, model=MODEL_B), lot("b2", 6.2, model=MODEL_B),
            # дороже лимита
            lot("pricey", 30.0, model=MODEL_B),
        ])
        self.store = Store(":memory:")
        self.clock = Clock(T0)
        self.scanner = Scanner(self.api, self.store, Config(), clock=self.clock, log=lambda m: None)

    async def test_full_paper_trade(self):
        events = await self.scanner.cycle()
        self.assertEqual([e.kind for e in events], ["signal", "open"])
        self.assertIn("Plush Pepe #48213", events[0].text)
        [pos] = self.store.positions("open")
        self.assertEqual(pos.slug, "cheap")

        # Через час кто-то покупает более дорогой соседний лот: наш (бумажный) продан.
        self.clock.t = T0 + 3600
        self.api.sell("x", T0 + 1800)
        events = await self.scanner.cycle()
        self.assertEqual([e.kind for e in events], ["close"])
        [done] = self.store.positions("closed")
        self.assertGreater(done.pnl, 0)

        # Тот же лот всё ещё на рынке, но повторно его не «покупаем» и не присылаем сигнал заново.
        self.clock.t = T0 + 7200
        self.api.listings.append(lot("x2", 8.5))
        events = await self.scanner.cycle()
        self.assertEqual([e.kind for e in events], [])

    async def test_budget_limits_positions(self):
        await self.scanner.cycle()
        self.api.listings += [lot("cheap2", 4.0, model=MODEL_B, gift_id=1), lot("b3", 9.0, model=MODEL_B)]
        self.clock.t = T0 + 3600
        await self.scanner.cycle()
        self.assertEqual(len(self.store.positions("open")), 1)  # max_open_positions = 1

    async def test_summary_renders(self):
        from giftbot import report
        await self.scanner.cycle()
        text = report.summary(self.store, Config(), int(self.clock.t))
        self.assertIn("Держим Plush Pepe #48213", text)
        self.assertIn("свободно 3.00 TON", text)


if __name__ == "__main__":
    unittest.main()
