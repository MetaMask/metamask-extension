import React from 'react';
import { NameType } from '@metamask/name-controller';
import { shortenAddress } from '../../../helpers/utils/util';
import { useDisplayName } from '../../../hooks/useDisplayName';
import { getMaybeHexChainId } from '../../../ducks/bridge/utils';

export function ContractName({
  address,
  chainId,
}: {
  address: string;
  chainId: string;
}) {
  const variation = getMaybeHexChainId(chainId) ?? chainId;
  const { name } = useDisplayName({
    type: NameType.ETHEREUM_ADDRESS,
    value: address,
    variation,
  });
  const shortAddress = shortenAddress(address);

  return (
    <span
      className="inline-flex min-w-0 max-w-full items-center gap-1"
      data-address={address}
      data-testid="transaction-details-contract"
    >
      {name ? <span className="truncate">{name}</span> : null}
      <span className="whitespace-nowrap">
        {name ? `(${shortAddress})` : shortAddress}
      </span>
    </span>
  );
}
