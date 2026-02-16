import React from 'react';
import type { Hex } from 'viem';
import {
  Text,
  TextButton,
  TextVariant,
  TextColor,
  IconName,
} from '@metamask/design-system-react';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP } from '../../../../../../shared/constants/common';
import { Row } from './row';

type Props = {
  label: string;
  chainId: Hex;
  hash: string | undefined;
};

export const TransactionHashRow = ({ label, chainId, hash }: Props) => {
  const t = useI18nContext();
  const baseUrl = CHAINID_DEFAULT_BLOCK_EXPLORER_URL_MAP[chainId];
  const explorerUrl = hash && baseUrl ? `${baseUrl}tx/${hash}` : null;

  return (
    <Row
      left={label}
      right={
        explorerUrl ? (
          <TextButton asChild endIconName={IconName.Export}>
            <a href={explorerUrl} target="_blank" rel="noopener noreferrer">
              {t('viewOnExplorer')}
            </a>
          </TextButton>
        ) : (
          <Text variant={TextVariant.BodySm} color={TextColor.TextAlternative}>
            {shortenAddress(hash)}
          </Text>
        )
      }
    />
  );
};
