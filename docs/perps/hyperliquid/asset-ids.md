# Asset IDs

Perpetual endpoints expect an integer for `asset`, which is the index of the coin found in the `meta` info response. E.g. `BTC = 0` on mainnet.

Spot endpoints expect `10000 + spotInfo["index"]` where `spotInfo` is the corresponding object in `spotMeta` that has the desired quote and base tokens. For example, when submitting an order for `PURR/USDC`, the asset that should be used is `10000` because its asset index in the spot info is `0`.

Builder-deployed perps expect `100000 + perp_dex_index * 10000 + index_in_meta` . For example, `test:ABC` on testnet has `perp_dex_index = 1` ,`index_in_meta = 0` , `asset = 110000` . Note that builder-deployed perps always have name in the format `{dex}:{coin}` .

### Examples

Note that spot ID is different from token ID, and that mainnet and testnet have different asset IDs. For example, for HYPE:

Mainnet token ID: 150

Mainnet spot ID: 107

Testnet token ID: 1105

Testnet spot ID: 1035
