from giftbot.models import Collection, Listing, Trait

MODEL_A = Trait("Amalgam", attr_id=111, permille=12)
MODEL_B = Trait("Bronze", attr_id=222, permille=30)
BLACK = Trait("Black", attr_id=9, permille=20)
BLUE = Trait("Blue", attr_id=5, permille=25)


def lot(slug: str, price: float | None, model: Trait = MODEL_A, backdrop: Trait = BLUE, num: int = 48213,
        gift_id: int = 1, collection: str = "Plush Pepe") -> Listing:
    return Listing(slug=slug, gift_id=gift_id, collection=collection, num=num, model=model, backdrop=backdrop,
                   price_ton=price, price_stars=None if price is None else int(price * 70))


class FakeApi:
    """Рынок для тестов: список лотов, который тест может менять между проходами."""

    def __init__(self, listings: list[Listing]):
        self.listings = list(listings)
        self.sales: dict[str, int] = {}
        self.calls = 0

    async def collections(self):
        return [Collection(1, "Plush Pepe", len(self.listings), None)]

    async def resale(self, gift_id, limit=50, model_id=None, backdrop_id=None):
        self.calls += 1
        out = [l for l in self.listings if l.gift_id == gift_id
               and (model_id is None or (l.model and l.model.attr_id == model_id))
               and (backdrop_id is None or (l.backdrop and l.backdrop.attr_id == backdrop_id))]
        return sorted(out, key=lambda l: (l.price_ton is None, l.price_ton or 0))[:limit]

    async def last_sale_ts(self, slug):
        return self.sales.get(slug)

    def sell(self, slug: str, ts: int) -> None:
        """Кто-то купил лот: он пропадает с рынка, Telegram помнит дату продажи."""
        self.listings = [l for l in self.listings if l.slug != slug]
        self.sales[slug] = ts
