import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import Modal from '../../modal';
import Typography from '../../../ui/typography';
import {
  TYPOGRAPHY,
  FONT_WEIGHT,
  ALIGN_ITEMS,
  DISPLAY,
} from '../../../../helpers/constants/design-system';
import Box from '../../../ui/box';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ADD_COLLECTIBLE_ROUTE } from '../../../../helpers/constants/routes';

const ConvertTokenToNFT = ({ hideModal, tokenAddress }) => {
  const history = useHistory();
  const t = useI18nContext();
  return (
    <Modal
      onSubmit={() => {
        history.push({
          pathname: ADD_COLLECTIBLE_ROUTE,
          state: { tokenAddress },
        });
        hideModal();
      }}
      submitText={t('yes')}
      onCancel={() => hideModal()}
      cancelText={t('cancel')}
      contentClass="convert-token-to-nft-content"
      containerClass="convert-token-to-nft-container"
    >
      <div className="convert-token-to-nft">
        <Box
          marginTop={2}
          display={DISPLAY.INLINE_FLEX}
          alignItems={ALIGN_ITEMS.CENTER}
        >
          <Typography variant={TYPOGRAPHY.H6} fontWeight={FONT_WEIGHT.NORMAL}>
            {t('convertTokenToNFTDescription')}
          </Typography>
        </Box>
      </div>
    </Modal>
  );
};

ConvertTokenToNFT.propTypes = {
  hideModal: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
};

export default withModalProps(ConvertTokenToNFT);
