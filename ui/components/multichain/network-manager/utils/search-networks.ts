import Fuse from 'fuse.js';

/**
 * Filters a list of networks by a user-provided search query, using the same
 * fuzzy-matching behavior as the network list menu search.
 *
 * @param networks - The networks to filter.
 * @param query - The user-provided search query.
 * @returns The networks matching the query, in their original order.
 */
export function searchNetworks<Item>(networks: Item[], query: string): Item[] {
  return query === ''
    ? networks
    : new Fuse(networks, {
        threshold: 0.2,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        shouldSort: false, // Maintain network order instead of ordering by search score
        keys: ['name', 'chainId', 'nativeCurrency'],
      }).search(query);
}
