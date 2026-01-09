# Exchange endpoint

### Asset

Many of the requests take asset as an input. For perpetuals this is the index in the `universe` field returned by the`meta` response. For spot assets, use `10000 + index` where `index` is the corresponding index in `spotMeta.universe`. For example, when submitting an order for `PURR/USDC`, the asset that should be used is `10000` because its asset index in the spot metadata is `0`.

### Subaccounts and vaults

Subaccounts and vaults do not have private keys. To perform actions on behalf of a subaccount or vault signing should be done by the master account and the vaultAddress field should be set to the address of the subaccount or vault. The basic_vault.py example in the Python SDK demonstrates this.

### Expires After

Some actions support an optional field `expiresAfter` which is a timestamp in milliseconds after which the action will be rejected. User-signed actions such as Core USDC transfer do not support the `expiresAfter` field. Note that actions consume 5x the usual address-based rate limit when canceled due to a stale `expiresAfter` field.&#x20;

See the Python SDK for details on how to incorporate this field when signing.&#x20;

## Place an order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

See Python SDK for full featured examples on the fields of the order request.

For limit orders, TIF (time-in-force) sets the behavior of the order upon first hitting the book.

ALO (add liquidity only, i.e. "post only") will be canceled instead of immediately matching.

IOC (immediate or cancel) will have the unfilled part canceled instead of resting.

GTC (good til canceled) orders have no special behavior.

Client Order ID (cloid) is an optional 128 bit hex string, e.g. `0x1234567890abcdef1234567890abcdef`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                              |       |                                                                                                                    |                                                                                         |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "order",<br> "orders": \[{</p><p> "a": Number,</p><p> "b": Boolean,</p><p> "p": String,</p><p> "s": String,</p><p> "r": Boolean,</p><p> "t": {</p><p> "limit": {</p><p> "tif": "Alo" | "Ioc" | "Gtc" </p><p> } or</p><p> "trigger": {</p><p> "isMarket": Boolean,</p><p> "triggerPx": String,</p><p> "tpsl": "tp" | "sl"</p><p> }</p><p> },</p><p> "c": Cloid (optional)</p><p> }],</p><p> "grouping": "na" | "normalTpsl" | "positionTpsl",</p><p> "builder": Optional({"b": "address", "f": Number})</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)<br><br>Meaning of keys in optional builder argument:<br>b is the address the should receive the additional fee<br>f is the size of the fee in tenths of a basis point e.g. if f is 10, 1bp of the order notional will be charged to the user and sent to the builder</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                 |       |                                                                                                                    |                                                                                         |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                          |       |                                                                                                                    |                                                                                         |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                   |       |                                                                                                                    |                                                                                         |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                |       |                                                                                                                    |                                                                                         |              |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |

{% tabs %}
{% tab title="200: OK Successful Response (resting)" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "resting":{
                  "oid":77738308
               }
            }
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "error":"Order must have minimum value of $10."
            }
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Successful Response (filled)" %}

```
{
   "status":"ok",
   "response":{
      "type":"order",
      "data":{
         "statuses":[
            {
               "filled":{
                  "totalSz":"0.02",
                  "avgPx":"1891.4",
                  "oid":77747314
               }
            }
         ]
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel order(s)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                   |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "cancel",</p><p> "cancels": \[</p><p> {</p><p> "a": Number,</p><p> "o": Number</p><p> }</p><p> ]</p><p>}<br><br>Meaning of keys:<br>a is asset<br>o is oid (order id)</p> |
|                                             |        |                                                                                                                                                                                               |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                      |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                               |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                     |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"cancel",
      "data":{
         "statuses":[
            "success"
         ]
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"cancel",
      "data":{
         "statuses":[
            {
               "error":"Order was never placed, already canceled, or filled."
            }
         ]
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel order(s) by cloid

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                     |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "cancelByCloid",</p><p> "cancels": \[</p><p> {</p><p> "asset": Number,</p><p> "cloid": String</p><p> }</p><p> ]</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                        |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                 |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000  |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                       |

{% tabs %}
{% tab title="200: OK Successful Response" %}

{% endtab %}

{% tab title="200: OK Error Response" %}

{% endtab %}
{% endtabs %}

## Schedule cancel (dead man's switch)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                    |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "scheduleCancel",</p><p> "time": number (optional)</p><p>}</p>                                                             |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                      |

Schedule a cancel-all operation at a future time. Not including time will remove the scheduled cancel operation. The time must be at least 5 seconds after the current time. Once the time comes, all open orders will be canceled and a trigger count will be incremented. The max number of triggers per day is 10. This trigger count is reset at 00:00 UTC.

## Modify an order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange` &#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                            |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                          |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "modify",</p><p> "oid": Number                                                                                                     | Cloid,</p><p> "order": {</p><p> "a": Number,</p><p> "b": Boolean,</p><p> "p": String,</p><p> "s": String,</p><p> "r": Boolean,</p><p> "t": {</p><p> "limit": {</p><p> "tif": "Alo" | "Ioc" | "Gtc" </p><p> } or</p><p> "trigger": {</p><p> "isMarket": Boolean,</p><p> "triggerPx": String,</p><p> "tpsl": "tp" | "sl"</p><p> }</p><p> },</p><p> "c": Cloid (optional)</p><p> }</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                               |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                          |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                        |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                          |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                          |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                              |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                          |

{% tabs %}
{% tab title="200: OK Successful Response" %}

{% endtab %}

{% tab title="200: OK Error Response" %}

{% endtab %}
{% endtabs %}

## Modify multiple orders

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                            |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                                    |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "batchModify",</p><p> "modifies": \[{</p><p> "oid": Number                                                                         | Cloid,</p><p> "order": {</p><p> "a": Number,</p><p> "b": Boolean,</p><p> "p": String,</p><p> "s": String,</p><p> "r": Boolean,</p><p> "t": {</p><p> "limit": {</p><p> "tif": "Alo" | "Ioc" | "Gtc" </p><p> } or</p><p> "trigger": {</p><p> "isMarket": Boolean,</p><p> "triggerPx": String,</p><p> "tpsl": "tp" | "sl"</p><p> }</p><p> },</p><p> "c": Cloid (optional)</p><p> }</p><p> }]</p><p>}<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>p is price<br>s is size<br>r is reduceOnly<br>t is type<br>c is cloid (client order id)</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                               |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                                    |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                        |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                                    |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                                    |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                              |                                                                                                                                                                                    |       |                                                                                                                    |                                                                                                                                                                                                                                    |

## Update leverage

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Update cross or isolated leverage on a coin.&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "updateLeverage",</p><p> "asset": index of coin,</p><p> "isCross": true or false if updating cross-leverage,</p><p> "leverage": integer representing new leverage, subject to leverage constraints on that coin</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                        |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                 |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                          |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                       |

{% tabs %}
{% tab title="200: OK Successful response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Update isolated margin

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Add or remove margin from isolated position

Note that to target a specific leverage instead of a USDC value of margin change, there is an alternate action `{"type": "topUpIsolatedOnlyMargin", "asset": <asset>, "leverage": <float string>}`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                         |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "updateIsolatedMargin",</p><p> "asset": index of coin,</p><p> "isBuy": true, (this parameter won't have any effect until hedge mode is introduced)</p><p> "ntli": int representing amount to add or remove with 6 decimals, e.g. 1000000 for 1 usd,</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                            |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                     |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                                                              |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                                                           |

{% tabs %}
{% tab title="200: OK Successful response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Core USDC transfer

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Send usd to another address. This transfer does not touch the EVM bridge. The signature format is human readable for wallet interfaces.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "usdSend",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p> "amount": amount of usd to send as a string, e.g. "1" for 1 usd,</p><p> "time": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Core spot transfer

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Send spot assets to another address. This transfer does not touch the EVM bridge. The signature format is human readable for wallet interfaces.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "spotSend",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br> "token": tokenName:tokenId; e.g. "PURR:0xc4bf3f870c0e9465323c0b6ed28096c2",</p><p> "amount": amount of token to send as a string, e.g. "0.01",</p><p> "time": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

```
Example sign typed data for generating the signature:
{
  "types": {
    "HyperliquidTransaction:SpotSend": [
      {
        "name": "hyperliquidChain",
        "type": "string"
      },
      {
        "name": "destination",
        "type": "string"
      },
      {
        "name": "token",
        "type": "string"
      },
      {
        "name": "amount",
        "type": "string"
      },
      {
        "name": "time",
        "type": "uint64"
      }
    ]
  },
  "primaryType": "HyperliquidTransaction:SpotSend",
  "domain": {
    "name": "HyperliquidSignTransaction",
    "version": "1",
    "chainId": 42161,
    "verifyingContract": "0x0000000000000000000000000000000000000000"
  },
  "message": {
    "destination": "0x0000000000000000000000000000000000000000",
    "token": "PURR:0xc1fb593aeffbeb02f85e0308e9956a90",
    "amount": "0.1",
    "time": 1716531066415,
    "hyperliquidChain": "Mainnet"
  }
}
```

## Initiate a withdrawal request

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to initiate the withdrawal flow. After making this request, the L1 validators will sign and send the withdrawal request to the bridge contract. There is a $1 fee for withdrawing at the time of this writing and withdrawals take approximately 5 minutes to finalize.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br> "type": "withdraw3",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "amount": amount of usd to send as a string, e.g. "1" for 1 usd,</p><p> "time": current timestamp in milliseconds as a Number, should match nonce,</p><p> "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                                                                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

{% tabs %}
{% tab title="200: OK " %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Transfer from Spot account to Perp account (and vice versa)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer USDC from the user's spot wallet to perp wallet and vice versa.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | "application/json" |

**Body**

<table><thead><tr><th>Name</th><th width="200">Type</th><th>Description</th></tr></thead><tbody><tr><td>action<mark style="color:red;">*</mark></td><td>Object</td><td><p>{</p><p>  "type": "usdClassTransfer",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "amount": amount of usd to transfer as a string, e.g. "1" for 1 usd. If you want to use this action for a subaccount, you can include subaccount: address after the amount, e.g. "1" subaccount:0x0000000000000000000000000000000000000000,</p><p>  "toPerp": true if (spot -> perp) else false,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p></td></tr><tr><td>nonce<mark style="color:red;">*</mark></td><td>Number</td><td>Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above</td></tr><tr><td>signature<mark style="color:red;">*</mark></td><td>Object</td><td></td></tr></tbody></table>

**Response**

{% tabs %}
{% tab title="200: OK" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Send Asset

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This generalized method is used to transfer tokens between different perp DEXs, spot balance, users, and/or sub-accounts. Use "" to specify the default USDC perp DEX and "spot" to specify spot. Only the collateral token can be transferred to or from a perp DEX.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "sendAsset",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),</p><p> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "destination": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p> "sourceDex": name of perp dex to transfer from,</p><p> "destinationDex": name of the perp dex to transfer to,</p><p> "token": tokenName:tokenId; e.g. "PURR:0xc4bf3f870c0e9465323c0b6ed28096c2",</p><p> "amount": amount of token to send as a string; e.g. "0.01",</p><p> "fromSubAccount": address in 42-character hexadecimal format or empty string if not from a subaccount,</p><p> "nonce": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Deposit into staking

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer native token from the user's spot account into staking for delegating to validators.&#x20;

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                     |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "cDeposit",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "wei": amount of wei to transfer as a number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                 |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Withdraw from staking

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

This method is used to transfer native token from staking into the user's spot account. Note that transfers from staking to spot account go through a 7 day unstaking queue.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                      |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "cWithdraw",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "wei": amount of wei to transfer as a number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds, must match the nonce in the action Object above                                                                                                                                                                                                                                                                                        |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                  |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Delegate or undelegate stake from validator

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Delegate or undelegate native tokens to or from a validator. Note that delegations to a particular validator have a lockup duration of 1 day.

#### Headers

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

#### Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "tokenDelegate",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "validator": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br>"isUndelegate": boolean,</p><p>"wei": number,</p><p>"nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |

#### Response

{% tabs %}
{% tab title="200: OK" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Deposit or withdraw from a vault

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Add or remove funds from a vault.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                       |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "vaultTransfer",</p><p> "vaultAddress": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,<br>"isDeposit": boolean,</p><p>"usd": number</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                          |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                   |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                         |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Approve an API wallet

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Approves an API Wallet (also sometimes referred to as an Agent Wallet). See [here](https://hyperliquid.gitbook.io/hyperliquid-docs/for-developers/api/nonces-and-api-wallets#api-wallets) for more details.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br> "type": "approveAgent",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "agentAddress": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p>"agentName": Optional name for the API wallet. An account can have 1 unnamed approved wallet and up to 3 named ones. And additional 2 named agents are allowed per subaccount,</p><p> "nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Approve a builder fee

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

Approve a maximum fee rate for a builder.

**Headers**

| Name                                           | Value              |
| ---------------------------------------------- | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | `application/json` |

**Body**

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{<br> "type": "approveBuilderFee",</p><p> "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),<br> "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p> "maxFeeRate": the maximum allowed builder fee rate as a percent string; e.g. "0.001%",</p><p> "builder": address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000,</p><p> "nonce": current timestamp in milliseconds as a Number, must match nonce in outer request body</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |

**Response**

{% tabs %}
{% tab title="200" %}

```json
{ "status": "ok", "response": { "type": "default" } }
```

{% endtab %}
{% endtabs %}

## Place a TWAP order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "twapOrder",<br> "twap": {</p><p> "a": Number,</p><p> "b": Boolean,</p><p> "s": String,</p><p> "r": Boolean,</p><p> "m": Number,</p><p> "t": Boolean</p><p> }</p><p> }<br><br>Meaning of keys:<br>a is asset<br>b is isBuy<br>s is size<br>r is reduceOnly</p><p>m is minutes<br>t is randomize</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                                                                                                                                                                                                |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                                                                                                                                                                                         |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its Onchain address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000                                                                                                                                                                  |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                                                                                                                                                                                               |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapOrder",
      "data":{
         "status": {
            "running":{
               "twapId":77738308
            }
         }
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapOrder",
      "data":{
         "status": {
            "error":"Invalid TWAP duration: 1 min(s)"
         }
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Cancel a TWAP order

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                                                                    |
| ------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "twapCancel",</p><p> "a": Number,</p><p> "t": Number</p><p>}<br><br>Meaning of keys:<br>a is asset<br>t is twap_id</p>     |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                                                       |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                                                                |
| vaultAddress                                | String | If trading on behalf of a vault or subaccount, its address in 42-character hexadecimal format; e.g. 0x0000000000000000000000000000000000000000 |
| expiresAfter                                | Number | Timestamp in milliseconds                                                                                                                      |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapCancel",
      "data":{
         "status": "success"
      }
   }
}
```

{% endtab %}

{% tab title="200: OK Error Response" %}

```
{
   "status":"ok",
   "response":{
      "type":"twapCancel",
      "data":{
         "status": {
            "error": "TWAP was never placed, already canceled, or filled."
         }
      }
   }
}
```

{% endtab %}
{% endtabs %}

## Reserve Additional Actions

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

Instead of trading to increase the address based rate limits, this action allows reserving additional actions for 0.0005 USDC per request. The cost is paid from the Perps balance.&#x20;

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                     |
| ------------------------------------------- | ------ | ------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "reserveRequestWeight",</p><p> "weight": Number</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                        |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                 |
| expiresAfter                                | Number | Timestamp in milliseconds                                                       |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Invalidate Pending Nonce (noop)

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

This action does not do anything (no operation), but causes the nonce to be marked as used. This can be a more effective way to cancel in-flight orders than the cancel action.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                              |
| ------------------------------------------- | ------ | -------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "noop"</p><p>}</p>                   |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds |
| signature<mark style="color:red;">\*</mark> | Object |                                                          |
| expiresAfter                                | Number | Timestamp in milliseconds                                |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Enable HIP-3 DEX abstraction

<mark style="color:green;">`POST`</mark> `https://api.hyperliquid.xyz/exchange`&#x20;

If set, actions on HIP-3 perps will automatically transfer collateral from validator-operated USDC perps balance for HIP-3 DEXs where USDC is the collateral token, and spot otherwise. When HIP-3 DEX abstraction is active, collateral is returned to the same source (validator-operated USDC perps or spot balance) when released from positions or open orders.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

<table><thead><tr><th width="106.30859375">Name</th><th width="159.5078125">Type</th><th>Description</th></tr></thead><tbody><tr><td>action<mark style="color:red;">*</mark></td><td>Object</td><td><p>{</p><p>  "type": "userDexAbstraction",</p><p>  "hyperliquidChain": "Mainnet" (on testnet use "Testnet" instead),</p><p>  "signatureChainId": the id of the chain used when signing in hexadecimal format; e.g. "0xa4b1" for Arbitrum,</p><p>  "user": address in 42-character hexadecimal format. Can be a sub-account of the user,</p><p>  "enabled": boolean,</p><p>  "nonce": current timestamp in milliseconds as a Number, should match nonce</p><p>}</p></td></tr><tr><td>nonce<mark style="color:red;">*</mark></td><td>Number</td><td>Recommended to use the current timestamp in milliseconds</td></tr><tr><td>signature<mark style="color:red;">*</mark></td><td>Object</td><td></td></tr></tbody></table>

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Enable HIP-3 DEX abstraction (agent)

Same effect as UserDexAbstraction above, but only works if setting the value from `null` to `true`.

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                 |
| ------------------------------------------- | ------ | ----------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "agentEnableDexAbstraction"</p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds    |
| signature<mark style="color:red;">\*</mark> | Object |                                                             |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}

## Validator vote on risk-free rate for aligned quote asset

#### Headers

| Name                                           | Type   | Description        |
| ---------------------------------------------- | ------ | ------------------ |
| Content-Type<mark style="color:red;">\*</mark> | String | "application/json" |

#### Request Body

| Name                                        | Type   | Description                                                                                               |
| ------------------------------------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| action<mark style="color:red;">\*</mark>    | Object | <p>{</p><p> "type": "validatorL1Stream",</p><p> "riskFreeRate": String // e.g. "0.04" for 4% </p><p>}</p> |
| nonce<mark style="color:red;">\*</mark>     | Number | Recommended to use the current timestamp in milliseconds                                                  |
| signature<mark style="color:red;">\*</mark> | Object |                                                                                                           |

{% tabs %}
{% tab title="200: OK Successful Response" %}

```
{'status': 'ok', 'response': {'type': 'default'}}
```

{% endtab %}
{% endtabs %}
