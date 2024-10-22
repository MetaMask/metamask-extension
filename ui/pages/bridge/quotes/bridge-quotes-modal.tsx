import React, { useState } from 'react';
import { IconName } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
} from '../../../components/component-library';
import {
  TextAlign,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { formatEtaInMinutes } from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';
import useBridgeQuotes from '../../../hooks/bridge/useBridgeQuotes';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const { sortedQuotes } = useBridgeQuotes();
  const t = useI18nContext();

  const [, setSortOrder] = useState(t('bridgeOverallCost'));
  return (
    <Modal className="quotes-modal" onClose={onClose} {...modalProps}>
      <ModalOverlay />
      <ModalContent modalDialogProps={{ padding: 0 }}>
        <ModalHeader onClose={onClose}>
          <Text variant={TextVariant.headingSm} textAlign={TextAlign.Center}>
            {t('swapSelectAQuote')}
          </Text>
        </ModalHeader>

        <Box className="quotes-modal__column-header">
          {[t('bridgeOverallCost'), t('time')].map((label) => {
            return (
              <>
                <ButtonIcon
                  iconName={IconName.Arrow2Down}
                  size={ButtonIconSize.Sm}
                  ariaLabel={t('back')}
                  onClick={() => setSortOrder(label)}
                />
                <Text>{label}</Text>
              </>
            );
          })}
        </Box>
        <Box className="quotes-modal__quotes">
          {sortedQuotes.map((quote, index) => {
            return (
              <Box key={index} className="quotes-modal__quotes__row">
                <Text>{quote.totalNetworkFee.fiat?.toString()}</Text>
                <Text>
                  {quote.adjustedReturn.fiat && quote.sentAmount.fiat
                    ? quote.adjustedReturn.fiat
                        .minus(quote.sentAmount.fiat)
                        .toFixed(2)
                    : ''}
                </Text>
                <Text>
                  {t('bridgeTimingMinutes', [
                    formatEtaInMinutes(quote.estimatedProcessingTimeInSeconds),
                  ])}
                </Text>
              </Box>
            );
          })}
        </Box>
      </ModalContent>
    </Modal>
  );
};
