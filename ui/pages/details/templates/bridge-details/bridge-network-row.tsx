import React from 'react';
import {
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import {
  formatChainIdToHex,
  isNonEvmChainId,
} from '@metamask/bridge-controller';
import type { CaipChainId } from '@metamask/utils';
import { useSelector } from 'react-redux';
import { getAllNetworkConfigurationsByCaipChainId } from '../../../../../shared/lib/selectors/networks';
import { getImageForChainId } from '../../../../selectors/multichain';

export const BridgeNetworkRow = ({
  fromChainId,
  toChainId,
}: {
  fromChainId: string;
  toChainId: string;
}) => {
  const config = useSelector(getAllNetworkConfigurationsByCaipChainId);

  const fromNetwork = config[fromChainId as CaipChainId];
  const toNetwork = config[toChainId as CaipChainId];

  const fromName = fromNetwork?.name ?? fromChainId;
  const toName = toNetwork?.name ?? toChainId;

  const fromSrc = getImageForChainId(
    isNonEvmChainId(fromChainId)
      ? fromChainId
      : formatChainIdToHex(fromChainId),
  );
  const toSrc = getImageForChainId(
    isNonEvmChainId(toChainId) ? toChainId : formatChainIdToHex(toChainId),
  );

  return (
    <div className="inline-flex items-center gap-2">
      <AvatarNetwork
        className="rounded"
        size={AvatarNetworkSize.Xs}
        name={fromName}
        src={fromSrc}
      />
      <span>{fromName}</span>
      <span>→</span>
      <AvatarNetwork
        className="rounded"
        size={AvatarNetworkSize.Xs}
        name={toName}
        src={toSrc}
      />
      <span>{toName}</span>
    </div>
  );
};
