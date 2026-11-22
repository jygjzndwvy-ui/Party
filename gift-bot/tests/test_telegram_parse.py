"""Проверяем, что ответы Telegram (типы Telethon) правильно превращаются в лоты."""
import unittest
from datetime import datetime, timezone

try:
    from telethon.tl import types
    from giftbot import telegram_api as tg
except ImportError:  # Telethon не установлен
    types = None


@unittest.skipIf(types is None, "нужен Telethon: pip install -r requirements.txt")
class ParseTest(unittest.TestCase):
    def unique(self, **overrides):
        data = dict(
            id=1, gift_id=2, title="Plush Pepe", slug="PlushPepe-1221", num=1221,
            attributes=[
                types.StarGiftAttributeModel(name="Amalgam", document=types.DocumentEmpty(id=111),
                                             rarity=types.StarGiftAttributeRarity(permille=12)),
                types.StarGiftAttributeBackdrop(name="Black", backdrop_id=9, center_color=0, edge_color=0,
                                                pattern_color=0, text_color=0,
                                                rarity=types.StarGiftAttributeRarityRare()),
                types.StarGiftAttributePattern(name="Star", document=types.DocumentEmpty(id=333),
                                               rarity=types.StarGiftAttributeRarity(permille=4)),
            ],
            availability_issued=100, availability_total=1000,
            resell_amount=[types.StarsAmount(amount=500, nanos=0), types.StarsTonAmount(amount=5_250_000_000)],
            resale_ton_only=True,
        )
        data.update(overrides)
        return types.StarGiftUnique(**data)

    def test_listing(self):
        l = tg.listing_from_unique(self.unique())
        self.assertEqual(l.title, "Plush Pepe #1221")
        self.assertEqual(l.link, "https://t.me/nft/PlushPepe-1221")
        self.assertEqual(l.price_ton, 5.25)
        self.assertEqual(l.price_stars, 500)
        self.assertTrue(l.ton_only)
        self.assertEqual((l.model.name, l.model.attr_id, l.model.permille), ("Amalgam", 111, 12))
        self.assertEqual(l.model.rarity_text(), "1.2%")
        self.assertEqual((l.backdrop.attr_id, l.backdrop.tier), (9, "rare"))
        self.assertEqual(l.pattern.attr_id, 333)

    def test_not_listed(self):
        l = tg.listing_from_unique(self.unique(resell_amount=None, resale_ton_only=None))
        self.assertIsNone(l.price_ton)
        self.assertFalse(l.ton_only)

    def test_value_info(self):
        sold = datetime(2026, 11, 20, tzinfo=timezone.utc)
        info = types.payments.UniqueStarGiftValueInfo(
            currency="USD", value=3150, initial_sale_date=None, initial_sale_stars=500, initial_sale_price=750,
            last_sale_date=sold, last_sale_price=2800, floor_price=2500, average_price=3010, listed_count=120,
        )
        v = tg.value_from_tl(info)
        self.assertEqual((v.value, v.last_sale_price, v.floor_price), (31.5, 28.0, 25.0))
        self.assertEqual(v.last_sale_ts, int(sold.timestamp()))

    def test_app_config_json(self):
        cfg = types.JsonObject(value=[
            types.JsonObjectValue(key="stars_resale_commission_permille", value=types.JsonNumber(value=200)),
            types.JsonObjectValue(key="list", value=types.JsonArray(value=[types.JsonString(value="a")])),
        ])
        self.assertEqual(tg.json_value(cfg), {"stars_resale_commission_permille": 200, "list": ["a"]})


if __name__ == "__main__":
    unittest.main()
