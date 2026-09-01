// A list of all names of data services available in the client.
//
// `createUIQueryClient` asserts that the namespace of every `useQuery` key is
// in this list, so a data service whose name is missing here throws
// "Queries must call actions on the messenger provided to createUIQueryClient"
// rather than fetching. Cross-context `cacheUpdated` subscriptions are wired up
// from this list too.
export const DATA_SERVICES: string[] = [
  'MoneyAccountBalanceService',
  'MoneyAccountApiDataService',
];
