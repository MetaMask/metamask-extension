# Frontend checks

There are many ways to reach invalid configurations during the spot deploy process. To avoid this, deployers can try intended deployments on testnet first. For automated deployment integrations, the following is a list of client-side checks that may be helpful.

### Token Deployment

```typescript
if (szDecimals === undefined || weiDecimals === undefined) {
  displayAlert('Size decimals and Wei decimals must be specified.', 'error');
  return;
}
if (szDecimals > 2 || szDecimals < 0) {
  displayAlert('Size decimals must be between 0 and 2.', 'error');
  return;
}
if (weiDecimals > 8 || weiDecimals < 0) {
  displayAlert('Wei decimals must be between 0 and 8.', 'error');
  return;
}
if (szDecimals + 5 > weiDecimals) {
  displayAlert('weiDecimals must be at least szDecimals + 5.', 'error');
  return;
}
```

### Set Deployer Trading Fee Share

```typescript
if (deployerTradingFeeShare === undefined) {
  displayAlert('Deployer trading fee share must be specified.', 'error');
  return;
}

if (deployerTradingFeeShare < 0 || deployerTradingFeeShare > 100) {
  displayAlert(
    'Deployer trading fee share must be between 0 and 100.',
    'error',
  );
  return;
}
```

### User and Anchor Token Genesis

```typescript
if (blacklistUser !== '') {
  if (amount !== '' || user !== '' || existingToken !== undefined) {
    displayAlert('Can only specify blacklist user by itself.', 'error');
    return;
  }
} else {
  if (amount.toString().length > 19) {
    displayAlert(`Can only enter up to 19 digits for Amount.`, 'error');
    return;
  }

  const hypotheticalTotalSupply =
    BigInt(activeTokenDeployState?.totalGenesisBalanceWei ?? 0) +
    BigInt(amount);

  if (hypotheticalTotalSupply > MAX_UINT_64 / BigInt(2)) {
    displayAlert('Total supply would be too large with this addition', 'error');
    return;
  }

  const minStartPrice = getMinStartPrice(szDecimals);
  if (
    minStartPrice * Number(formatUnits(hypotheticalTotalSupply, weiDecimals)) >
    MAX_MARKET_CAP_MILLIONS_START * 1e6
  ) {
    displayAlert(
      'Total supply would be too large even at smallest possible Hyperliquidity initial price',
      'error',
    );
    return;
  }

  if (
    (!isAddress(user) && existingToken === undefined) ||
    (isAddress(user) && existingToken !== undefined)
  ) {
    displayAlert(
      'Exactly one of user or existing token must be specified.',
      'error',
    );
    return;
  }

  if (user.toLowerCase() === HYPERLIQUIDITY_USER) {
    displayAlert(
      'Cannot assign genesis balance to hyperliquidity user',
      'error',
    );
    return;
  }
}

if (!activeTokenDeployState || activeTokenDeployState.token === undefined) {
  displayAlert('Need to handle fetching previously created token.', 'error');
  return;
}

const minWei = getWei(100000, activeTokenDeployState.spec.weiDecimals);
if (
  existingToken !== undefined &&
  !isAddress(user) &&
  BigInt(amount) < BigInt(minWei)
) {
  displayAlert(
    `Using an existing token as anchor token for genesis requires a minimum amount of 100,000 ${activeTokenDeployState.spec.name} (wei=${minWei}).`,
    'error',
  );
  return;
}
```

### Hyperliquidity

<pre class="language-typescript"><code class="lang-typescript">    const PX_GAP = 0.003;
    const MAX_N_ORDERS = 4000;
    const MAX_MARKET_CAP_BILLIONS_END = 100;
    const MIN_MARKET_CAP_BILLIONS_END = 1;
<strong>    const MAX_MARKET_CAP_MILLIONS_START = 10;
</strong><strong>    const MAX_UINT_64 = BigInt("18446744073709551615");
</strong>
    if (
      startPx === undefined ||
      orderSz === undefined ||
      orderCount === undefined ||
      nSeededLevels === undefined
    ) {
      displayAlert(
        "Lowest price, order size, number of orders and number of seeded levels must be specified.",
        "error"
      );
      return;
    }

    const minStartPx = getMinStartPx(szDecimals);
    if (startPx &#x3C; minStartPx) {
      displayAlert(
        `First order price must be at least ${roundPx(
          minStartPx,
          szDecimals,
          true
        )}`,
        "error"
      );
      return;
    }

    if (startPx * orderSz &#x3C; 1) {
      displayAlert("First order size must be at least 1 USDC", "error");
      return;
    }

    if (!activeTokenDeployState || activeTokenDeployState.spots.length === 0) {
      displayAlert(
        "Unexpected error: spot and token should already be registered.",
        "error"
      );
      return;
    }

    const pxRange = Math.ceil(Math.pow(1 + PX_GAP, orderCount));
    const endPx = startPx * pxRange;
    // 1e9 instead of 1e8 because backend checks against u64::MAX / 10
    if (
      pxRange > 1_000_000 ||
      hyperliquidityTotalWei > MAX_UINT_64 ||
      endPx * orderSz * 1e9 > MAX_UINT_64
    ) {
      displayAlert(
        "Total Hyperliquidity token allocation is too large.",
        "error"
      );
      return;
    }

    const minTotalGenesisBalanceSz = 100_000_000;
    if (totalSupply * Math.pow(10, szDecimals) &#x3C; minTotalGenesisBalanceSz) {
      displayAlert(
        `Total genesis balance must be at least ${minTotalGenesisBalanceSz} lots (minimal tradeable units, i.e. one lot is 0.01 if szDecimals is 2)`,
        "error"
      );
      return;
    }

    const endMarketCap = totalSupply * endPx;
    if (endMarketCap > MAX_MARKET_CAP_BILLIONS_END * 1e9) {
      displayAlert(
        `Market cap must be &#x3C;${MAX_MARKET_CAP_BILLIONS_END}B USDC at Hyperliquidity end price`,
        "error"
      );
      return;
    }

    if (endMarketCap &#x3C; MIN_MARKET_CAP_BILLIONS_END * 1e9) {
      displayAlert(
        `Market cap must be >${MIN_MARKET_CAP_BILLIONS_END}B USDC at Hyperliquidity end price`,
        "error"
      );
      return;
    }

    if (totalSupply * startPx > MAX_MARKET_CAP_MILLIONS_START * 1e6) {
      displayAlert(
        `Market cap must be &#x3C;${MAX_MARKET_CAP_MILLIONS_START}M USDC at Hyperliquidity start price`,
        "error"
      );
      return;
    }

    if (orderCount &#x3C; 10) {
      displayAlert("Hyperliquidity must have at least 10 orders", "error");
      return;
    }

    if ((orderSz * orderCount) / totalSupply &#x3C;= 0.01) {
      displayAlert("Hyperliquidity must be >1% of total supply", "error");
      return;
    }
    
    if (usdcNeeded > webData.clearinghouseState.withdrawable) {
      displayAlert(
        "Insufficient perps USDC to deploy seeded levels",
        "error"
      );
      return;
    }
</code></pre>
