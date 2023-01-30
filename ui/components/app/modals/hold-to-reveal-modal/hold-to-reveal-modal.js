import PropTypes from 'prop-types';
import React from 'react';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import Box from '../../../ui/box';
import {
  Text,
  Button,
  BUTTON_TYPES,
  ButtonIcon,
  ICON_NAMES,
} from '../../../component-library';
import {
  ALIGN_ITEMS,
  DISPLAY,
  FLEX_DIRECTION,
  JUSTIFY_CONTENT,
  SIZES,
  TEXT,
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
      justifyContent={JUSTIFY_CONTENT.FLEX_START}
      padding={6}
    >
      <Box
        display={DISPLAY.FLEX}
        flexDirection={FLEX_DIRECTION.ROW}
        alignItems={ALIGN_ITEMS.CENTER}
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        marginBottom={6}
      >
        <Text variant={TEXT.HEADING_SM}>{t('holdToRevealTitle')}</Text>
        <ButtonIcon
          className="hold-to-reveal-modal__close"
          iconName={ICON_NAMES.CLOSE_OUTLINE}
          size={SIZES.SM}
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
        <Text variant={TEXT.BODY_MD}>
          {t('holdToRevealContent1', [
            <Text key="hold-to-reveal-2" variant={TEXT.BODY_MD_BOLD} as="span">
              {t('holdToRevealContent2')}
            </Text>,
          ])}
        </Text>
        <Text variant={TEXT.BODY_MD_BOLD}>
          {t('holdToRevealContent3', [
            <Text
              key="hold-to-reveal-4"
              variant={TEXT.BODY_MD}
              as="span"
              display={DISPLAY.INLINE}
            >
              {t('holdToRevealContent4')}
            </Text>,
            <Button
              key="hold-to-reveal-5"
              type={BUTTON_TYPES.LINK}
              size={SIZES.AUTO}
              href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
              target="_blank"
              rel="noopener noreferrer"
              buttonTextProps={{
                variant: TEXT.BODY_MD,
              }}
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
