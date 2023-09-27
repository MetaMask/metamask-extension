import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import TextField from '../../../ui/text-field';
import {
  TextVariant,
  AlignItems,
  BlockSize,
  Display,
} from '../../../../helpers/constants/design-system';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
  Box,
  ButtonIcon,
  ButtonIconSize,
  ButtonLink,
  IconName,
  Text,
} from '../../../component-library';

const CustomizeNonce = ({
  hideModal,
  customNonceValue,
  nextNonce,
  updateCustomNonce,
  getNextNonce,
}) => {
  const [customNonce, setCustomNonce] = useState('');
  const t = useI18nContext();

  return (
    <Modal
      onSubmit={() => {
        if (customNonce === '') {
          updateCustomNonce(customNonceValue);
        } else {
          updateCustomNonce(customNonce);
        }
        getNextNonce();
        hideModal();
      }}
      submitText={t('save')}
      onCancel={() => hideModal()}
      cancelText={t('cancel')}
      contentClass="customize-nonce-modal-content"
      containerClass="customize-nonce-modal-container"
    >
      <div className="customize-nonce-modal">
        <div className="customize-nonce-modal__main-header">
          <Text
            className="customize-nonce-modal__main-title"
            variant={TextVariant.headingSm}
            as="h4"
          >
            {t('editNonceField')}
          </Text>
          <ButtonIcon
            iconName={IconName.Close}
            className="customize-nonce-modal__close"
            size={ButtonIconSize.Sm}
            ariaLabel={t('close')}
            onClick={hideModal}
          />
        </div>
        <Box
          marginTop={2}
          display={Display.InlineFlex}
          alignItems={AlignItems.center}
        >
          <Text variant={TextVariant.bodyMd} as="h6">
            {t('editNonceMessage')}
            <ButtonLink
              className="customize-nonce-modal__link"
              rel="noopener noreferrer"
              target="_blank"
              href={ZENDESK_URLS.CUSTOMIZE_NONCE}
            >
              {t('learnMoreUpperCase')}
            </ButtonLink>
          </Text>
        </Box>
        <Box marginTop={4}>
          <Box alignItems={AlignItems.center} display={Display.Flex}>
            <Text
              variant={TextVariant.bodyMdBold}
              as="h6"
              width={BlockSize.FiveSixths}
            >
              {t('editNonceField')}
            </Text>
            <Box width={BlockSize.OneSixth}>
              <ButtonLink
                className="customize-nonce-modal__reset"
                data-testid="customize-nonce-reset"
                onClick={() => {
                  setCustomNonce(nextNonce);
                }}
              >
                {t('reset')}
              </ButtonLink>
            </Box>
          </Box>
          <div className="customize-nonce-modal__input">
            <TextField
              type="number"
              data-testid="custom-nonce-input"
              min="0"
              placeholder={
                customNonceValue ||
                (typeof nextNonce === 'number' && nextNonce.toString())
              }
              onChange={(e) => {
                setCustomNonce(e.target.value);
              }}
              fullWidth
              margin="dense"
              value={customNonce}
              id="custom-nonce-id"
            />
          </div>
        </Box>
      </div>
    </Modal>
  );
};

CustomizeNonce.propTypes = {
  hideModal: PropTypes.func.isRequired,
  customNonceValue: PropTypes.string,
  nextNonce: PropTypes.number,
  updateCustomNonce: PropTypes.func,
  getNextNonce: PropTypes.func,
};
export default withModalProps(CustomizeNonce);
