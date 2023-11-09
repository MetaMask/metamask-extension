import React, { useContext } from 'react';

import { I18nContext } from '../../../contexts/i18n';
import {
  TextColor,
  Display,
  FlexDirection,
  FontWeight,
  BlockSize,
  AlignItems,
  JustifyContent,
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
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';

interface Props {
  onStartSwapping: () => void;
  onManageStxInSettings: () => void;
  isOpen: boolean;
}

export default function SmartTransactionsPopover({
  onStartSwapping,
  onManageStxInSettings,
  isOpen,
}: Props) {
  const t = useContext(I18nContext);
  return (
    <Modal
      isOpen={isOpen}
      onClose={onStartSwapping}
      isClosedOnOutsideClick={false}
      isClosedOnEscapeKey={false}
      className="mm-modal__custom-scrollbar"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
        >
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
              src="./images/logo/metamask-smart-transactions.png"
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
            {t('smartSwapsDescription2', [
              <ButtonLink
                size={ButtonLinkSize.Inherit}
                href={'https://support.metamask.io/hc/articles/9184393821211'}
                externalLink
              >
                {t('faqAndRiskDisclosures')}
              </ButtonLink>,
            ])}
          </Text>
          <Button
            variant={ButtonVariant.Primary}
            onClick={onStartSwapping}
            width={BlockSize.Full}
          >
            {t('startSwapping')}
          </Button>
          <Button
            type="link"
            variant={ButtonVariant.Link}
            onClick={onManageStxInSettings}
            width={BlockSize.Full}
          >
            {t('manageInSettings')}
          </Button>
        </Box>
      </ModalContent>
    </Modal>
  );
}
