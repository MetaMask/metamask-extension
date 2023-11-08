import React, { useContext } from 'react';

import { I18nContext } from '../../../contexts/i18n';
import {
  TextColor,
  Display,
  FlexDirection,
  FontWeight,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Box,
  Button,
  ButtonVariant,
} from '../../../components/component-library';

interface Props {
  onEnableSmartTransactionsClick: () => void;
  onCloseSmartTransactionsOptInPopover: () => void;
  isOpen: boolean;
}

export default function SmartTransactionsPopover({
  onEnableSmartTransactionsClick,
  onCloseSmartTransactionsOptInPopover,
  isOpen,
}: Props) {
  const t = useContext(I18nContext);
  return (
    <Modal isOpen={isOpen} onClose={onCloseSmartTransactionsOptInPopover}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader onClose={onCloseSmartTransactionsOptInPopover}>
          {t('smartSwapsAreHere')}
        </ModalHeader>

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          gap={4}
          marginTop={4}
        >
          <Box display={Display.Flex} flexDirection={FlexDirection.Column}>
            <img
              src="./images/logo/smart-transactions-header.png"
              alt={t('swapSwapSwitch')}
            />
          </Box>
          <Text>{t('smartSwapsDescription')}</Text>
          <Text
            as="ul"
            marginTop={3}
            marginBottom={3}
            style={{ listStyle: 'inside' }}
          >
            <li>{t('stxBenefit1')}</li>
            <li>{t('stxBenefit2')}</li>
            <li>{t('stxBenefit3')}</li>
            <li>
              {t('stxBenefit4')}
              <Text as="span" fontWeight={FontWeight.Normal}>
                {' *'}
              </Text>
            </li>
          </Text>
          <Text color={TextColor.textAlternative}>
            {t('smartSwapsSubDescription')}&nbsp;
            <Text
              as="span"
              fontWeight={FontWeight.Bold}
              color={TextColor.textAlternative}
            >
              {t('stxYouCanOptOut')}&nbsp;
            </Text>
          </Text>

          <Button
            variant={ButtonVariant.Primary}
            onClick={onEnableSmartTransactionsClick}
            width={BlockSize.Full}
          >
            {t('enableSmartSwaps')}
          </Button>

          <Button
            type="link"
            variant={ButtonVariant.Link}
            onClick={onCloseSmartTransactionsOptInPopover}
            width={BlockSize.Full}
          >
            {t('noThanksVariant2')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
