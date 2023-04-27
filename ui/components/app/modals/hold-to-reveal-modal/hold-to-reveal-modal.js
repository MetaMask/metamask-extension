import PropTypes from 'prop-types';
import React from 'react';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  Text,
  Button,
  BUTTON_VARIANT,
  ButtonIcon,
  IconName,
} from '../../../component-library';
import {
  AlignItems,
  DISPLAY,
  FLEX_DIRECTION,
  JustifyContent,
  Size,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import HoldToRevealButton from '../../hold-to-reveal-button';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';

const HoldToRevealModal = ({ onLongPressed, hideModal }) => {
  const t = useI18nContext();

  const unlock = () => {
    onLongPressed();
    hideModal();
  };

  const handleCancel = () => {
    hideModal();
  };

  return (
    <Box
      className="hold-to-reveal-modal"
      display={DISPLAY.FLEX}
      flexDirection={FLEX_DIRECTION.COLUMN}
      justifyContent={JustifyContent.flexStart}
      padding={6}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={AlignItems.center}
        justifyContent={JustifyContent.spaceBetween}
        marginBottom={6}
      >
        <Text variant={TextVariant.headingSm}>{t('holdToRevealTitle')}</Text>
        <ButtonIcon
          className="hold-to-reveal-modal__close"
          iconName={IconName.Close}
          size={Size.SM}
          onClick={handleCancel}
          ariaLabel={t('close')}
        />
      </Box>
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.COLUMN}
        gap={4}
        marginBottom={6}
      >
        <Text variant={TextVariant.bodyMd}>
          {t('holdToRevealContent1', [
            <Text
              key="hold-to-reveal-2"
              variant={TextVariant.bodyMdBold}
              as="span"
            >
              {t('holdToRevealContent2')}
            </Text>,
          ])}
        </Text>
        <Text variant={TextVariant.bodyMdBold}>
          {t('holdToRevealContent3', [
            <Text
              key="hold-to-reveal-4"
              variant={TextVariant.bodyMd}
              as="span"
              display={DISPLAY.INLINE}
            >
              {t('holdToRevealContent4')}
            </Text>,
            <Button
              key="hold-to-reveal-5"
              variant={BUTTON_VARIANT.LINK}
              size={Size.auto}
              href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('holdToRevealContent5')}
            </Button>,
          ])}
        </Text>
      </Box>
      <HoldToRevealButton
        buttonText={t('holdToReveal')}
        onLongPressed={unlock}
        marginLeft="auto"
        marginRight="auto"
      />
    </Box>
  );
};

HoldToRevealModal.propTypes = {
  // The function to be executed after the hold to reveal long press has been completed
  onLongPressed: PropTypes.func.isRequired,
  hideModal: PropTypes.func,
};

export default withModalProps(HoldToRevealModal);
