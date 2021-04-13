import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../modal';
import TextField from '../../../ui/text-field';
import Button from '../../../ui/button';
import Typography from '../../../ui/typography';
import {
  COLORS,
  TYPOGRAPHY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
  BLOCK_SIZES,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';

const CustomizeNonce = ({
  hideModal,
  customNonceValue,
  nextNonce,
  updateCustomNonce,
  getNextNonce,
}) => {
  const [customNonce, setCustomNonce] = useState('');
  const t = useI18nContext();

  const renderModalContent = (
    <div className="customize-nonce-modal">
      <div className="customize-nonce-modal__main-header">
        <Typography variant={TYPOGRAPHY.H4} fontWeight={FONT_WEIGHT.BOLD}>
          {t('editNonceField')}
        </Typography>
        <button
          className="fas fa-times customize-nonce-modal__close"
          title={t('close')}
          onClick={hideModal}
        />
      </div>
      <div className="customize-nonce-modal__description">
        <Typography
          variant={TYPOGRAPHY.H6}
          fontWeight={FONT_WEIGHT.NORMAL}
          tag="span"
        >
          {t('editNonceMessage')}
        </Typography>
        <Typography
          className="cursor-pointer"
          variant={TYPOGRAPHY.H6}
          fontWeight={FONT_WEIGHT.NORMAL}
          color={COLORS.PRIMARY1}
          tag="span"
        >
          <a
            rel="noopener noreferrer"
            target="_blank"
            href="https://metamask.zendesk.com/hc/en-us/articles/360015489251"
          >
            {t('learnMore')}
          </a>
        </Typography>
      </div>
      <div className="customize-nonce-modal__content">
        <Box
          alignItems={ALIGN_ITEMS.CENTER}
          className="customize-nonce-modal__header"
        >
          <Typography
            variant={TYPOGRAPHY.H6}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ width: BLOCK_SIZES.FIVE_SIXTHS }}
          >
            {t('editNonceField')}
          </Typography>
          <Box width={BLOCK_SIZES.ONE_SIXTH}>
            <Button
              type="link"
              className="customize-nonce-modal__reset"
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
      </div>
    </div>
  );
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
      submitType="primary"
      onCancel={() => hideModal()}
      cancelText={t('cancel')}
      cancelType="secondary"
      rounded
      contentClass="customize-nonce-modal-content"
      containerClass="customize-nonce-modal-container"
    >
      {renderModalContent}
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
