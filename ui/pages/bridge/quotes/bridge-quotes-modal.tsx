import React from 'react';
import { useSelector } from 'react-redux';
import { IconName } from '@metamask/snaps-sdk/jsx';
import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconSize,
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
import { formatEtaInMinutes, formatFiatAmount } from '../utils/quote';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getCurrentCurrency } from '../../../selectors';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();

  const { sortedQuotes } = useSelector(getBridgeQuotes);
  const currency = useSelector(getCurrentCurrency);

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
              <Button key={label} variant={ButtonVariant.Link}>
                <Icon name={IconName.Arrow2Down} size={IconSize.Sm} />
                <Text>{label}</Text>
              </Button>
            );
          })}
        </Box>
        <Box className="quotes-modal__quotes">
          {sortedQuotes.map((quote, index) => {
            const {
              totalNetworkFee,
              sentAmount,
              adjustedReturn,
              estimatedProcessingTimeInSeconds,
              quote: { bridges },
            } = quote;
            return (
              <Box key={index} className="quotes-modal__quotes__row">
                <Text>{formatFiatAmount(adjustedReturn.fiat, currency)}</Text>
                <Text>{formatFiatAmount(totalNetworkFee?.fiat, currency)}</Text>
                <Text>
                  {adjustedReturn.fiat && sentAmount.fiat
                    ? `-${formatFiatAmount(
                        sentAmount.fiat.minus(adjustedReturn.fiat),
                        currency,
                      )}`
                    : ''}
                </Text>
                <Text>{bridges[0]}</Text>
                <Text>
                  {t('bridgeTimingMinutes', [
                    formatEtaInMinutes(estimatedProcessingTimeInSeconds),
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
