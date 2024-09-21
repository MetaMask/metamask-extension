export function getPortfolioUrl(
  endpoint = '',
  metamaskEntry = '',
  metaMetricsId = '',
  metricsEnabled = false,
  marketingEnabled = false,
  accountAddress,
  tab,
) {
  const baseUrl = process.env.PORTFOLIO_URL || '';
  const url = new URL(endpoint, baseUrl);

  url.searchParams.append('metamaskEntry', metamaskEntry);
  url.searchParams.append('metametricsId', metaMetricsId);

  // Append privacy preferences for metrics + marketing on user navigation to Portfolio
  url.searchParams.append('metricsEnabled', String(metricsEnabled));
  url.searchParams.append('marketingEnabled', String(marketingEnabled));

  if (accountAddress) {
    url.searchParams.append('accountAddress', accountAddress);
  }

  if (tab) {
    url.searchParams.append('tab', tab);
  }

  return url.href;
}
