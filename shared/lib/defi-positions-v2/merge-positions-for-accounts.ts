import type {
  DeFiPositionDetailsSection,
  DeFiPositionsByAccount,
  DeFiProtocolPositionGroup,
} from './group-defi-positions-v6';

/**
 * Merges details-page sections that share the same `productName`, appending
 * positions rather than keeping them as separate adjacent sections.
 *
 * @param existingSections - Sections already collected for this protocol group.
 * @param incomingSections - Sections from another account holding the same
 * protocol, to be merged in.
 * @returns The merged sections, one per distinct `productName`.
 */
function mergeSections(
  existingSections: DeFiPositionDetailsSection[],
  incomingSections: DeFiPositionDetailsSection[],
): DeFiPositionDetailsSection[] {
  const byProductName = new Map<string, DeFiPositionDetailsSection>(
    existingSections.map((section) => [
      section.productName,
      { ...section, positions: [...section.positions] },
    ]),
  );

  for (const section of incomingSections) {
    const existing = byProductName.get(section.productName);

    if (!existing) {
      byProductName.set(section.productName, {
        ...section,
        positions: [...section.positions],
      });
      continue;
    }

    existing.positions.push(...section.positions);
  }

  return [...byProductName.values()];
}

/**
 * Merges the protocol groups of every account in the selected group into a
 * single flat list, combining groups that share the same chain and protocol.
 *
 * The controller stores DeFi positions keyed per internal account, but every
 * client surface consumes the selected account group as a single merged list.
 * This helper is exported so both clients share one implementation rather than
 * each maintaining a copy.
 *
 * @param positionsByAccount - DeFi positions keyed by internal account ID.
 * @param accountIds - Internal account IDs in the selected account group.
 * @returns The merged protocol groups.
 */
export function mergePositionsForAccounts(
  positionsByAccount: DeFiPositionsByAccount,
  accountIds: string[],
): DeFiProtocolPositionGroup[] {
  const byKey = new Map<string, DeFiProtocolPositionGroup>();

  for (const accountId of accountIds) {
    for (const group of positionsByAccount[accountId] ?? []) {
      const key = `${group.chainId}#${group.protocolId}`;
      const existing = byKey.get(key);

      if (!existing) {
        // Clone so we never mutate the object held in client state.
        byKey.set(key, {
          ...group,
          iconGroup: [...group.iconGroup],
          sections: mergeSections([], group.sections),
        });
        continue;
      }

      existing.marketValue += group.marketValue;
      for (const icon of group.iconGroup) {
        if (!existing.iconGroup.some((item) => item.symbol === icon.symbol)) {
          existing.iconGroup.push(icon);
        }
      }
      existing.sections = mergeSections(existing.sections, group.sections);
    }
  }

  return [...byKey.values()];
}
