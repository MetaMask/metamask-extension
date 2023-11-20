export function getPortfolioUrl(
  endpoint = '',
  metamaskEntry = '',
  metaMetricsId = '',
) {
  const portfolioUrl = process.env.PORTFOLIO_URL || '';
  return `${portfolioUrl}/${endpoint}?metamaskEntry=${metamaskEntry}&metametricsId=${metaMetricsId}`;
}
