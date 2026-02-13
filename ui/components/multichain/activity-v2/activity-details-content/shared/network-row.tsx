import React from 'react';
import {
  Text,
  TextVariant,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import type { Hex } from 'viem';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../../../shared/constants/network';
import { Row } from './row';

type Props = {
  chainId: Hex;
};

export const NetworkRow = ({ chainId }: Props) => {
  const t = useI18nContext();
  const chainImageUrl = CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[chainId];
  const chainName =
    NETWORK_TO_NAME_MAP[chainId as keyof typeof NETWORK_TO_NAME_MAP] ||
    'Unknown Network';

  return (
    <Row
      left={t('network')}
      right={
        <div className="flex items-center gap-2">
          <AvatarNetwork
            name={chainName}
            src={chainImageUrl}
            size={AvatarNetworkSize.Xs}
          />
          <Text variant={TextVariant.BodySm}>{chainName}</Text>
        </div>
      }
    />
  );
};
