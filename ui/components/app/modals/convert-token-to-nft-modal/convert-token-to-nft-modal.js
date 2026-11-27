import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Modal from '../../modal';
import { Text } from '../../../component-library/text';
import withModalProps from '../../../../helpers/higher-order-components/with-modal-props';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import {
  ASSET_ROUTE,
  IMPORT_NFTS_ROUTE,
} from '../../../../helpers/constants/routes';
import { getNfts } from '../../../../ducks/metamask/metamask';
import { hideAsset } from '../../../../store/actions';
import { toAssetId } from '../../../../../shared/lib/asset-utils';
import { isEqualCaseInsensitive } from '../../../../../shared/lib/string-utils';
import { getCurrentChainId } from '../../../../../shared/lib/selectors/networks';
import { useDispatch } from '../../../../store/hooks';

const ConvertTokenToNFTModal = ({ hideModal, tokenAddress }) => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const allNfts = useSelector(getNfts);
  const tokenAddedAsNFT = allNfts.find(({ address }) =>
    isEqualCaseInsensitive(address, tokenAddress),
  );
  const chainId = useSelector(getCurrentChainId);

  return (
    <Modal
      onSubmit={async () => {
        if (tokenAddedAsNFT) {
          const assetId = toAssetId(tokenAddress, chainId);
          if (assetId) {
            await dispatch(hideAsset(assetId));
          }
          const { tokenId } = tokenAddedAsNFT;
          navigate(`${ASSET_ROUTE}/${tokenAddress}/${tokenId}`);
        } else {
          navigate(IMPORT_NFTS_ROUTE, {
            state: { tokenAddress, ignoreErc20Token: true },
          });
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
