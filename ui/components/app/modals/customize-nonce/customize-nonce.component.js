import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import TextField from '../../../ui/text-field';
import Button from '../../../ui/button';
import {
  TextVariant,
  FontWeight,
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import {
  ButtonIcon,
  ButtonIconSize,
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
            fontWeight={FontWeight.Bold}
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
          display={DISPLAY.INLINE_FLEX}
          alignItems={AlignItems.center}
        >
          <Text
            variant={TextVariant.bodySm}
            as="h6"
            fontWeight={FontWeight.Normal}
          >
            {t('editNonceMessage')}
            <Button
              type="link"
              className="customize-nonce-modal__link"
              rel="noopener noreferrer"
              target="_blank"
              href={ZENDESK_URLS.CUSTOMIZE_NONCE}
            >
              {t('learnMoreUpperCase')}
            </Button>
          </Text>
        </Box>
        <Box marginTop={3}>
          <Box alignItems={AlignItems.center} display={DISPLAY.FLEX}>
            <Text
              variant={TextVariant.bodySm}
              as="h6"
              fontWeight={FontWeight.Bold}
              boxProps={{ width: BLOCK_SIZES.FIVE_SIXTHS }}
            >
              {t('editNonceField')}
            </Text>
            <Box width={BLOCK_SIZES.ONE_SIXTH}>
              <Button
                type="link"
                className="customize-nonce-modal__reset"
                data-testid="customize-nonce-reset"
                onClick={() => {
                  setCustomNonce(nextNonce);
                }}
              >
                {t('reset')}
              </Button>
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
