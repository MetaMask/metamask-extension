import React from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Modal from '../../modal';
import { Text } from '../../../component-library/text';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { ASSET_ROUTE } from '../../../../helpers/constants/routes';
import { getNfts } from '../../../../ducks/metamask/metamask';
import { ignoreTokens, showImportNftsModal } from '../../../../store/actions';
import { isEqualCaseInsensitive } from '../../../../../shared/modules/string-utils';

const ConvertTokenToNFTModal = ({ hideModal, tokenAddress }) => {
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const allNfts = useSelector(getNfts);
  const tokenAddedAsNFT = allNfts.find(({ address }) =>
    isEqualCaseInsensitive(address, tokenAddress),
  );

  return (
    <Modal
      onSubmit={async () => {
        if (tokenAddedAsNFT) {
          await dispatch(
            ignoreTokens({
              tokensToIgnore: tokenAddress,
              dontShowLoadingIndicator: true,
            }),
          );
          const { tokenId } = tokenAddedAsNFT;
          history.push({
            pathname: `${ASSET_ROUTE}/${tokenAddress}/${tokenId}`,
          });
        } else {
          dispatch(
            showImportNftsModal({ tokenAddress, ignoreErc20Token: true }),
          );
        }
        hideModal();
      }}
      submitText={t('yes')}
      onCancel={() => hideModal()}
      cancelText={t('cancel')}
    >
      <div className="convert-token-to-nft-modal">
        <Text marginTop={2}>
          {tokenAddedAsNFT
            ? t('convertTokenToNFTExistDescription')
            : t('convertTokenToNFTDescription')}
        </Text>
      </div>
    </Modal>
  );
};

ConvertTokenToNFTModal.propTypes = {
  hideModal: PropTypes.func.isRequired,
  tokenAddress: PropTypes.string,
};

export default withModalProps(ConvertTokenToNFTModal);
