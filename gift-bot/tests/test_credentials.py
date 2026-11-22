import unittest

from giftbot.credentials import ask_credentials

FAKE_HASH = "0123456789abcdef0123456789abcdef"  # выдуманный, не настоящий


class AskCredentialsTest(unittest.TestCase):
    def run_with(self, answers):
        replies = iter(answers)
        said: list[str] = []
        result = ask_credentials(ask=lambda prompt: next(replies), say=said.append)
        return result, said

    def test_normal_input(self):
        self.assertEqual(self.run_with(["12345678", FAKE_HASH])[0], (12345678, FAKE_HASH))

    def test_hash_typed_into_id_field_is_explained(self):
        result, said = self.run_with([FAKE_HASH, " 12345678 ", FAKE_HASH])
        self.assertEqual(result, (12345678, FAKE_HASH))
        self.assertTrue(any("Это api_hash" in s for s in said))

    def test_broken_hash_is_asked_again(self):
        result, said = self.run_with(["1", "short", FAKE_HASH + "x", FAKE_HASH])
        self.assertEqual(result, (1, FAKE_HASH))
        self.assertEqual(sum("32 знака" in s for s in said), 2)


if __name__ == "__main__":
    unittest.main()
