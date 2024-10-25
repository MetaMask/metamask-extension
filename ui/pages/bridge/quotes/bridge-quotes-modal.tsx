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
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { formatEtaInMinutes } from '../utils/quote';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const t = useI18nContext();

  const { sortedQuotes } = useSelector(getBridgeQuotes);

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
            const { totalNetworkFee, estimatedProcessingTimeInSeconds, cost } =
              quote;
            return (
              <Box key={index} className="quotes-modal__quotes__row">
                <Text>{totalNetworkFee.fiat?.toString()}</Text>
                <Text>{cost.fiat ? cost.fiat.toFixed(2) : ''}</Text>
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
