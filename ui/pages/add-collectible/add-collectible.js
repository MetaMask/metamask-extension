import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { util } from '@metamask/controllers';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';

import Box from '../../components/ui/box';
import PageContainer from '../../components/ui/page-container';
import {
  addCollectibleVerifyOwnership,
  removeToken,
  setNewCollectibleAddedMessage,
} from '../../store/actions';
import FormField from '../../components/ui/form-field';
import { getIsMainnet, getUseCollectibleDetection } from '../../selectors';
import { getCollectiblesDetectionNoticeDismissed } from '../../ducks/metamask/metamask';
import CollectiblesDetectionNotice from '../../components/app/collectibles-detection-notice';

export default function AddCollectible() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const useCollectibleDetection = useSelector(getUseCollectibleDetection);
  const isMainnet = useSelector(getIsMainnet);
  const collectibleDetectionNoticeDismissed = useSelector(
    getCollectiblesDetectionNoticeDismissed,
  );
  const addressEnteredOnImportTokensPage =
    history?.location?.state?.addressEnteredOnImportTokensPage;
  const contractAddressToConvertFromTokenToCollectible =
    history?.location?.state?.tokenAddress;

  const [address, setAddress] = useState(
    addressEnteredOnImportTokensPage ??
      contractAddressToConvertFromTokenToCollectible ??
      '',
  );
  const [tokenId, setTokenId] = useState('');
  const [disabled, setDisabled] = useState(true);

  const handleAddCollectible = async () => {
    try {
      await dispatch(
        addCollectibleVerifyOwnership(address, tokenId.toString()),
      );
    } catch (error) {
      const { message } = error;
      dispatch(setNewCollectibleAddedMessage(message));
      history.push(DEFAULT_ROUTE);
      return;
    }
    if (contractAddressToConvertFromTokenToCollectible) {
      await dispatch(
        removeToken(contractAddressToConvertFromTokenToCollectible),
      );
    }
    dispatch(setNewCollectibleAddedMessage('success'));
    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!util.isValidHexAddress(val) || !tokenId);
    setAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDisabled(!util.isValidHexAddress(address) || !val);
    setTokenId(val);
  };

  return (
    <PageContainer
      title={t('importNFT')}
      onSubmit={() => {
        handleAddCollectible();
      }}
      submitText={t('add')}
      onCancel={() => {
        history.push(DEFAULT_ROUTE);
      }}
      onClose={() => {
        history.push(DEFAULT_ROUTE);
      }}
      disabled={disabled}
      contentComponent={
        <Box padding={4}>
          {isMainnet &&
          !useCollectibleDetection &&
          !collectibleDetectionNoticeDismissed ? (
            <CollectiblesDetectionNotice />
          ) : null}
          <Box>
            <FormField
              id="address"
              titleText={t('address')}
              placeholder="0x..."
              value={address}
              onChange={(val) => validateAndSetAddress(val)}
              tooltipText={t('importNFTAddressToolTip')}
              autoFocus
            />
          </Box>
          <Box>
            <FormField
              id="token-id"
              titleText={t('tokenId')}
              placeholder={t('nftTokenIdPlaceholder')}
              value={tokenId}
              onChange={(val) => {
                validateAndSetTokenId(val);
              }}
              tooltipText={t('importNFTTokenIdToolTip')}
              numeric
            />
          </Box>
        </Box>
      }
    />
  );
}
