import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Icon,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import Card from '../../../ui/card';
import { Label } from '../../../component-library';
import { useI18nContext } from '../../../../hooks/useI18nContext';

export type SelectSrpProps = {
  srpName: string;
  srpAccounts: number;
  onClick: () => void;
};

export const SelectSrp = ({
  srpName,
  srpAccounts,
  onClick,
}: SelectSrpProps) => {
  const t = useI18nContext();

  return (
    <Box data-testid="select-srp-container">
      <Label marginBottom={2}>{t('selectSecretRecoveryPhrase')}</Label>
      <Card
        onClick={onClick}
        paddingTop={1}
        paddingBottom={1}
        className="select-srp__container"
        data-testid={`select-srp-${srpName}`}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Between}
        >
          <Box>
            <Text>{srpName}</Text>
            <Text variant={TextVariant.BodySm} color={TextColor.TextMuted}>
              {srpAccounts > 1
                ? t('srpListNumberOfAccounts', [srpAccounts])
                : t('srpListSingleOrZero', [srpAccounts])}
            </Text>
          </Box>
          <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
        </Box>
      </Card>
      <Box marginTop={1}>
        <Text variant={TextVariant.BodySm}>
          {t('srpListSelectionDescription')}
        </Text>
      </Box>
    </Box>
  );
};
