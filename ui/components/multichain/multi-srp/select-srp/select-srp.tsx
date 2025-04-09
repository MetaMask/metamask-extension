import React from 'react';
import Card from '../../../ui/card';
import {
  Box,
  IconName,
  Icon,
  Text,
  IconSize,
  Label,
} from '../../../component-library';
import {
  JustifyContent,
  Display,
  TextColor,
  FlexDirection,
  AlignItems,
  TextVariant,
} from '../../../../helpers/constants/design-system';
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
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box>
            <Text>{srpName}</Text>
            <Text variant={TextVariant.bodySm} color={TextColor.textMuted}>
              {srpAccounts > 1
                ? t('srpListNumberOfAccounts', [srpAccounts])
                : t('srpListSingleOrZero', [srpAccounts])}
            </Text>
          </Box>
          <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
        </Box>
      </Card>
      <Text variant={TextVariant.bodySm} marginTop={1}>
        {t('srpListSelectionDescription')}
      </Text>
    </Box>
  );
};
