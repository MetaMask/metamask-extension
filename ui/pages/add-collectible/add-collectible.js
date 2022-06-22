import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { util } from '@metamask/controllers';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  DISPLAY,
  FONT_WEIGHT,
  TYPOGRAPHY,
} from '../../helpers/constants/design-system';

import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import ActionableMessage from '../../components/ui/actionable-message';
import PageContainer from '../../components/ui/page-container';
import {
  addCollectibleVerifyOwnership,
  getTokenStandardAndDetails,
  removeToken,
  setNewCollectibleAddedMessage,
} from '../../store/actions';
import FormField from '../../components/ui/form-field';
import { getIsMainnet, getUseCollectibleDetection } from '../../selectors';
import { getCollectiblesDetectionNoticeDismissed } from '../../ducks/metamask/metamask';
import CollectiblesDetectionNotice from '../../components/app/collectibles-detection-notice';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { ASSET_TYPES } from '../../../shared/constants/transaction';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

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
  const [collectibleAddFailed, setCollectibleAddFailed] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  const handleAddCollectible = async () => {
    try {
      await dispatch(addCollectibleVerifyOwnership(address, tokenId));
    } catch (error) {
      const { message } = error;
      dispatch(setNewCollectibleAddedMessage(message));
      setCollectibleAddFailed(true);
      return;
    }
    if (contractAddressToConvertFromTokenToCollectible) {
      await dispatch(
        removeToken(contractAddressToConvertFromTokenToCollectible),
      );
    }
    dispatch(setNewCollectibleAddedMessage('success'));

    const tokenDetails = await getTokenStandardAndDetails(
      address,
      null,
      tokenId.toString(),
    );

    trackEvent({
      event: EVENT_NAMES.TOKEN_ADDED,
      category: 'Wallet',
      sensitiveProperties: {
        token_contract_address: address,
        token_symbol: tokenDetails?.symbol,
        tokenId: tokenId.toString(),
        asset_type: ASSET_TYPES.COLLECTIBLE,
        token_standard: tokenDetails?.standard,
        source: EVENT.SOURCE.TOKEN.CUSTOM,
      },
    });

    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!util.isValidHexAddress(val) || !tokenId);
    setAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDisabled(!util.isValidHexAddress(address) || !val || isNaN(Number(val)));
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
        <Box>
          {isMainnet &&
          !useCollectibleDetection &&
          !collectibleDetectionNoticeDismissed ? (
            <CollectiblesDetectionNotice />
          ) : null}
          {collectibleAddFailed && (
            <ActionableMessage
              type="danger"
              useIcon
              iconFillColor="var(--color-error-default)"
              message={
                <Box display={DISPLAY.INLINE_FLEX}>
                  <Typography
                    variant={TYPOGRAPHY.H7}
                    fontWeight={FONT_WEIGHT.NORMAL}
                    margin={0}
                  >
                    {t('collectibleAddFailedMessage')}
                  </Typography>
                  <button
                    className="fas fa-times add-collectible__close"
                    title={t('close')}
                    onClick={() => setCollectibleAddFailed(false)}
                  />
                </Box>
              }
            />
          )}
          <Box margin={4}>
            <FormField
              dataTestId="address"
              titleText={t('address')}
              placeholder="0x..."
              value={address}
              onChange={(val) => {
                validateAndSetAddress(val);
                setCollectibleAddFailed(false);
              }}
              tooltipText={t('importNFTAddressToolTip')}
              autoFocus
            />
            <FormField
              dataTestId="token-id"
              titleText={t('tokenId')}
              placeholder={t('nftTokenIdPlaceholder')}
              value={tokenId}
              onChange={(val) => {
                validateAndSetTokenId(val);
                setCollectibleAddFailed(false);
              }}
              tooltipText={t('importNFTTokenIdToolTip')}
            />
          </Box>
        </Box>
      }
    />
  );
}
