export const METAMASK_FACILITATOR_ADDRESSES = [
  '0xB01caEa8c6C47bbf4F4b4c5080Ca642043359C2E',
  '0xC066ac5D385419B1A8c43A0E146fA439837a8B8c',
  '0xB42F812A44c22cc6b861478900401ee759EbEAD6',
] as const;

export const METAMASK_FACILITATOR_ADDRESSES_DEV = [
  '0xb4827A2a066CD2Ef88560EFdf063dD05C6c41cC7',
] as const;

export const ALL_METAMASK_FACILITATOR_ADDRESSES = [
  ...METAMASK_FACILITATOR_ADDRESSES,
  ...METAMASK_FACILITATOR_ADDRESSES_DEV,
] as const;

const METAMASK_FACILITATOR_ADDRESSES_LOWERCASE = new Set<string>(
  ALL_METAMASK_FACILITATOR_ADDRESSES.map((address) => address.toLowerCase()),
);

export function areOnlyMetaMaskFacilitatorAddresses(
  addresses: string[] | null | undefined,
): boolean {
  if (!addresses?.length) {
    return false;
  }

  const normalizedAddresses = new Set(
    addresses.map((address) => address.toLowerCase()),
  );

  return (
    normalizedAddresses.size === addresses.length &&
    [...normalizedAddresses].every((address) =>
      METAMASK_FACILITATOR_ADDRESSES_LOWERCASE.has(address),
    )
  );
}
