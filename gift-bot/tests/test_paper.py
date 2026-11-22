import unittest

from giftbot.analysis import evaluate
from giftbot.config import Config
from giftbot.models import Segment
from giftbot.paper import DAY, manage_position, open_position
from giftbot.store import Store

from helpers import MODEL_A, lot

T0 = 1_800_000_000


class PaperTest(unittest.IsolatedAsyncioTestCase):
    def setUp(self):
        self.cfg = Config()
        self.store = Store(":memory:")
        self.sales: dict[str, int] = {}
        candidate = lot("c", 5.0)
        self.segment = [candidate, lot("x", 8.0), lot("y", 9.0), lot("z", 10.0)]
        ev = evaluate(candidate, [Segment("модель Amalgam", MODEL_A.attr_id, None, self.segment)], self.cfg)
        self.pos = open_position(self.store, ev, T0)

    async def last_sale(self, slug):
        return self.sales.get(slug)

    async def manage(self, listings, now):
        events = await manage_position(self.pos, listings, self.last_sale, self.cfg, now)
        self.store.save_position(self.pos)
        return events

    def test_open_uses_cash(self):
        self.assertEqual(self.pos.ask, 7.76)
        self.assertEqual(self.pos.snapshot, {"x": 8.0, "y": 9.0, "z": 10.0})
        self.assertAlmostEqual(self.store.cash(self.cfg.bank_ton), 3.0)

    async def test_nothing_happens_when_market_is_quiet(self):
        events = await self.manage(self.segment, T0 + 3600)
        self.assertEqual(events, [])
        self.assertEqual(self.pos.status, "open")

    async def test_sold_when_pricier_neighbour_is_bought(self):
        self.sales["x"] = T0 + 1800
        events = await self.manage([l for l in self.segment if l.slug != "x"], T0 + 3600)
        self.assertEqual([e.kind for e in events], ["close"])
        self.assertAlmostEqual(self.pos.pnl, round(7.76 * 0.9 - 5.0, 4))
        self.assertAlmostEqual(self.store.cash(self.cfg.bank_ton), 8.0 + self.pos.pnl)

    async def test_delisted_neighbour_does_not_count_as_sale(self):
        events = await self.manage([l for l in self.segment if l.slug != "x"], T0 + 3600)
        self.assertEqual(events, [])
        self.assertEqual(self.pos.status, "open")

    async def test_old_sale_does_not_count(self):
        self.sales["x"] = T0 - 10 * DAY
        await self.manage([l for l in self.segment if l.slug != "x"], T0 + 3600)
        self.assertEqual(self.pos.status, "open")

    async def test_no_sale_when_someone_is_cheaper_than_us(self):
        cheaper = lot("w", 7.0)
        await self.manage(self.segment + [cheaper], T0 + 3600)
        self.sales["x"] = T0 + 5000
        await self.manage([l for l in self.segment if l.slug != "x"] + [cheaper], T0 + 7200)
        self.assertEqual(self.pos.status, "open")

    async def test_daily_price_ladder_follows_competitor(self):
        cheaper = lot("w", 7.0)
        events = await self.manage(self.segment + [cheaper], T0 + DAY)
        self.assertEqual([e.kind for e in events], ["reprice"])
        self.assertEqual(self.pos.ask, round(7.0 * 0.97, 2))

    async def test_ladder_never_goes_below_breakeven(self):
        dumped = [lot("c", 5.0), lot("x", 5.0), lot("y", 5.1)]
        await self.manage(dumped, T0 + DAY)
        self.assertEqual(self.pos.ask, 5.56)  # 5 / 0.9 = 5.555… → округление вверх

    async def test_forced_sale_after_max_hold(self):
        market = [lot("c", 5.0), lot("x", 6.0), lot("y", 6.5)]
        events = await self.manage(market, T0 + 7 * DAY)
        self.assertEqual([e.kind for e in events], ["close"])
        self.assertEqual(self.pos.close_price, round(6.0 * 0.97, 2))
        self.assertAlmostEqual(self.pos.pnl, round(5.82 * 0.9 - 5.0, 4))

    async def test_forced_sale_can_be_a_loss(self):
        market = [lot("c", 5.0), lot("x", 4.0), lot("y", 4.5)]
        await self.manage(market, T0 + 7 * DAY)
        self.assertLess(self.pos.pnl, 0)


if __name__ == "__main__":
    unittest.main()
