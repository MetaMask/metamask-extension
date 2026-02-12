import React from 'react';
import {
  Text,
  TextVariant,
  AvatarNetwork,
  AvatarNetworkSize,
} from '@metamask/design-system-react';
import type { Hex } from 'viem';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { mapChainInfo } from '../../helpers';
import { Row } from '.';

type Props = {
  chainId: Hex;
};

export const NetworkRow = ({ chainId }: Props) => {
  const t = useI18nContext();
  const { chainImageUrl, chainName } = mapChainInfo(chainId);
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
