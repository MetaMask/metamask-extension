import React from 'react';
import {
  Text,
  TextButton,
  TextVariant,
  TextColor,
  IconName,
} from '@metamask/design-system-react';
import { shortenAddress } from '../../../../../helpers/utils/util';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { Row } from '.';

type Props = {
  label: string;
  explorerUrl: string | null |undefined;
  hash: string | undefined;
};

export const TransactionHashRow = ({ label, explorerUrl, hash }: Props) => {
  const t = useI18nContext();

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
          <Text
            variant={TextVariant.BodySm}
            color={TextColor.TextAlternative}
          >
            {shortenAddress(hash)}
          </Text>
        )
      }
    />
  );
};
