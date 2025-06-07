// Default filter predicate for whether a token should be included in displayed list
export const shouldIncludeToken = (
  symbol: string,
  address?: string | null,
  tokenChainId?: string,
  debouncedSearchQuery: string,
  isMultiselectEnabled: boolean,
  selectedChainIds: string[],
  selectedChainId: string,
  filteredTokensAddresses: Set<string>,
  getTokenKey: (address?: string | null, tokenChainId?: string) => string,
) => {
  const trimmedSearchQuery = debouncedSearchQuery.trim().toLowerCase();
  const isMatchedBySearchQuery = Boolean(
    !trimmedSearchQuery ||
      symbol?.toLowerCase().indexOf(trimmedSearchQuery) !== -1 ||
      address?.toLowerCase().indexOf(trimmedSearchQuery) !== -1,
  );
  const isTokenInSelectedChain = isMultiselectEnabled
    ? tokenChainId && selectedChainIds?.indexOf(tokenChainId) !== -1
    : selectedNetwork?.chainId === tokenChainId;

  return Boolean(
    isTokenInSelectedChain &&
      isMatchedBySearchQuery &&
      !filteredTokensAddresses.has(getTokenKey(address, tokenChainId)),
  );
};
