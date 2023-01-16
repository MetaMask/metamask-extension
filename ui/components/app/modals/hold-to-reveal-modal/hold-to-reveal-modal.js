import PropTypes from 'prop-types';
import React from 'react';
import Button from '../../../ui/button';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { Text, ButtonIcon } from '../../../component-library';
import { SIZES, TEXT } from '../../../../helpers/constants/design-system';
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
    <div className="hold-to-reveal-modal">
      <div className="hold-to-reveal-modal__header">
        <div className="hold-to-reveal-modal__title">
          <Text variant={TEXT.HEADING_SM}>{t('holdToRevealTitle')}</Text>
        </div>
        <ButtonIcon
          className="hold-to-reveal-modal__close"
          iconName="close-outline"
          size={SIZES.SM}
          onClick={handleCancel}
        />
      </div>
      <div className="hold-to-reveal-modal__content">
        <Text variant={TEXT.BODY_MD}>
          {t('holdToRevealContent1', [
            <Text key="hold-to-reveal-2" variant={TEXT.BODY_MD_BOLD} as="span">
              {t('holdToRevealContent2')}
            </Text>,
          ])}
        </Text>
        <br />
        <Text variant={TEXT.BODY_MD_BOLD}>
          {t('holdToRevealContent3', [
            <Text key="hold-to-reveal-4" variant={TEXT.BODY_MD} as="span">
              {t('holdToRevealContent4')}
            </Text>,

            <Button
              key="hold-to-reveal-5"
              type="link"
              href={ZENDESK_URLS.NON_CUSTODIAL_WALLET}
              target="_blank"
              rel="noopener noreferrer"
              className="settings-page__inline-link"
            >
              {t('holdToRevealContent5')}
            </Button>,
          ])}
        </Text>
      </div>
      <div className="hold-to-reveal-modal__footer">
        <HoldToRevealButton
          buttonText={t('holdToReveal')}
          onLongPressed={unlock}
        />
      </div>
    </div>
  );
};

HoldToRevealModal.propTypes = {
  onLongPressed: PropTypes.func.isRequired,
  hideModal: PropTypes.func,
};

export default withModalProps(HoldToRevealModal);
