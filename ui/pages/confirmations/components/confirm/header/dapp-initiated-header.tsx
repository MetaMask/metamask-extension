import { TransactionMeta } from '@metamask/transaction-controller';
import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useConfirmContext } from '../../../context/confirm';
import { SEND_TRANSACTION_TYPES } from '../../../constants/send';
import { AdvancedDetailsButton } from './advanced-details-button';

export const DAppInitiatedHeader = () => {
  const t = useI18nContext();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();

  const isSendTransaction =
    currentConfirmation?.type &&
    SEND_TRANSACTION_TYPES.includes(currentConfirmation.type);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      backgroundColor={BackgroundColor.backgroundDefault}
      paddingInline={3}
      paddingTop={4}
      paddingBottom={4}
      style={{
        zIndex: 2,
        position: 'relative',
        minHeight: isSendTransaction ? '64px' : 'auto',
      }}
    >
      {!isSendTransaction && (
        <Text variant={TextVariant.headingSm} color={TextColor.inherit}>
          {t('transferRequest')}
        </Text>
      )}
      <Box
        paddingRight={3}
        style={{ marginLeft: 'auto', position: 'absolute', right: 0 }}
      >
        <AdvancedDetailsButton />
      </Box>
    </Box>
  );
};
