import React, { useState } from 'react';
import { useSelector } from 'react-redux';
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
import { getBridgeQuotes } from '../../../ducks/bridge/selectors';
import { getQuoteDisplayData } from '../utils/quote';
import { useI18nContext } from '../../../hooks/useI18nContext';

export const BridgeQuotesModal = ({
  onClose,
  ...modalProps
}: Omit<React.ComponentProps<typeof Modal>, 'children'>) => {
  const { quotes } = useSelector(getBridgeQuotes);
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
          {quotes.map((quote, index) => {
            const { totalFees, etaInMinutes } = getQuoteDisplayData(quote);
            return (
              <Box key={index} className="quotes-modal__quotes__row">
                <Text>{totalFees?.fiat}</Text>
                <Text>{t('bridgeTimingMinutes', [etaInMinutes])}</Text>
              </Box>
            );
          })}
        </Box>
      </ModalContent>
    </Modal>
  );
};
