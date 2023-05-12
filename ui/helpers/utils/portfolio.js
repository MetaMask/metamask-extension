export function getPortfolioUrl(
  endpoint = '',
  metamaskEntry = '',
  metaMetricsId = '',
) {
  return `${'https://portfolio-builds.metafi-dev.codefi.network/72fccb9371121795e848c6d47ed2476dda45e9bb'}/${endpoint}?metamaskEntry=${metamaskEntry}&metametricsId=${metaMetricsId}`;
}
