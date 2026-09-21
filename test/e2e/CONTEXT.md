# Custom Network E2E

Language for featured and custom EVM networks exercised by the extension's end-to-end suite.

## Language

**Custom Network**:
An EVM chain the wallet can select that is not Ethereum Mainnet, including featured chains that are absent from the default fixture.
_Avoid_: custom chain, helper chain, test chain

**Native Asset**:
The chain's own currency. The identifier stored in network enablement can differ from the identifier the Tokens tab requests for the same currency.
_Avoid_: coin, ticker, native token

**Conversion Rate**:
The fiat value shown next to an asset on the Tokens tab. Missing when the price feed does not support the Native Asset.
_Avoid_: spot price, secondary value, fiat price
