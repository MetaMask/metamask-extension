# Tick and lot size

Both Price (px) and Size (sz) have a maximum number of decimals that are accepted.&#x20;

Prices can have up to 5 significant figures, but no more than `MAX_DECIMALS - szDecimals` decimal places where `MAX_DECIMALS` is 6 for perps and 8 for spot. Integer prices are always allowed, regardless of the number of significant figures. E.g. `123456` is a valid price even though `12345.6` is not.

Sizes are rounded to the `szDecimals` of that asset. For example, if `szDecimals = 3` then `1.001` is a valid size but `1.0001` is not.&#x20;

`szDecimals` for an asset is found in the meta response to the info endpoint

### Perp price examples

`1234.5` is valid but `1234.56` is not (too many significant figures)

`0.001234` is valid, but `0.0012345` is not (more than 6 decimal places)

If `szDecimals = 1` , `0.01234` is valid but `0.012345` is not (more than `6 - szDecimals` decimal places)

### Spot price examples

`0.0001234` is valid if `szDecimals` is 0 or 1, but not if `szDecimals` is greater than 2 (more than 8-2 decimal places).&#x20;

### Signing

Note that if implementing signing, trailing zeroes should be removed. See [Signing](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/signing) for more details.
