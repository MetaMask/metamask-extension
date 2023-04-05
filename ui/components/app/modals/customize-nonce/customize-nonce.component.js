import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import TextField from '../../../ui/text-field';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import {
  TypographyVariant,
  FONT_WEIGHT,
  AlignItems,
  BLOCK_SIZES,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../../helpers/constants/zendesk-url';
import { ButtonIcon } from '../../../component-library';
import {
  ICON_NAMES,
  ICON_SIZES,
} from '../../../component-library/icon/deprecated';

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
          <Typography
            className="customize-nonce-modal__main-title"
            variant={TypographyVariant.H4}
            fontWeight={FONT_WEIGHT.BOLD}
          >
            {t('editNonceField')}
          </Typography>
          <ButtonIcon
            iconName={ICON_NAMES.CLOSE}
            className="customize-nonce-modal__close"
            size={ICON_SIZES.SM}
            ariaLabel={t('close')}
            onClick={hideModal}
          />
        </div>
        <Box
          marginTop={2}
          display={DISPLAY.INLINE_FLEX}
          alignItems={AlignItems.center}
        >
          <Typography
            variant={TypographyVariant.H6}
            fontWeight={FONT_WEIGHT.NORMAL}
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
          </Typography>
        </Box>
        <Box marginTop={3}>
          <Box alignItems={AlignItems.center} display={DISPLAY.FLEX}>
            <Typography
              variant={TypographyVariant.H6}
              fontWeight={FONT_WEIGHT.BOLD}
              boxProps={{ width: BLOCK_SIZES.FIVE_SIXTHS }}
            >
              {t('editNonceField')}
            </Typography>
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
