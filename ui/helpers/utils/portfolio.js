export function getPortfolioUrl(
  endpoint = '',
  metamaskEntry = '',
  metaMetricsId = '',
  metricsEnabled,
  marketingEnabled,
) {
  const baseUrl = process.env.PORTFOLIO_URL || '';
  const url = new URL(endpoint, baseUrl);

  url.searchParams.append('metamaskEntry', metamaskEntry);
  url.searchParams.append('metametricsId', metaMetricsId);

  // If defined, append privacy preferences for metrics + marketing on user navigation to Portfolio
  if (metricsEnabled !== undefined) {
    url.searchParams.append('metricsEnabled', String(metricsEnabled));
  }
  if (marketingEnabled !== undefined) {
    url.searchParams.append('marketingEnabled', String(marketingEnabled));
  }

  return url.href;
}
