import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isValidHexAddress } from '@metamask/controller-utils';
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
  addNftVerifyOwnership,
  getTokenStandardAndDetails,
  ignoreTokens,
  setNewNftAddedMessage,
} from '../../store/actions';
import FormField from '../../components/ui/form-field';
import { getIsMainnet, getUseNftDetection } from '../../selectors';
import { getNftsDetectionNoticeDismissed } from '../../ducks/metamask/metamask';
import NftsDetectionNotice from '../../components/app/nfts-detection-notice';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { ASSET_TYPES } from '../../../shared/constants/transaction';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

export default function AddNft() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const nftDetectionNoticeDismissed = useSelector(
    getNftsDetectionNoticeDismissed,
  );
  const addressEnteredOnImportTokensPage =
    history?.location?.state?.addressEnteredOnImportTokensPage;
  const contractAddressToConvertFromTokenToNft =
    history?.location?.state?.tokenAddress;

  const [address, setAddress] = useState(
    addressEnteredOnImportTokensPage ??
      contractAddressToConvertFromTokenToNft ??
      '',
  );
  const [tokenId, setTokenId] = useState('');
  const [disabled, setDisabled] = useState(true);
  const [nftAddFailed, setNftAddFailed] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  const handleAddNft = async () => {
    try {
      await dispatch(addNftVerifyOwnership(address, tokenId));
    } catch (error) {
      const { message } = error;
      dispatch(setNewNftAddedMessage(message));
      setNftAddFailed(true);
      return;
    }
    if (contractAddressToConvertFromTokenToNft) {
      await dispatch(
        ignoreTokens({
          tokensToIgnore: contractAddressToConvertFromTokenToNft,
          dontShowLoadingIndicator: true,
        }),
      );
    }
    dispatch(setNewNftAddedMessage('success'));

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
        asset_type: ASSET_TYPES.NFT,
        token_standard: tokenDetails?.standard,
        source: EVENT.SOURCE.TOKEN.CUSTOM,
      },
    });

    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!isValidHexAddress(val) || !tokenId);
    setAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDisabled(!isValidHexAddress(address) || !val || isNaN(Number(val)));
    setTokenId(val);
  };

  return (
    <PageContainer
      title={t('importNFT')}
      onSubmit={() => {
        handleAddNft();
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
          {isMainnet && !useNftDetection && !nftDetectionNoticeDismissed ? (
            <NftsDetectionNotice />
          ) : null}
          {nftAddFailed && (
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
                    {t('nftAddFailedMessage')}
                  </Typography>
                  <button
                    className="fas fa-times add-nft__close"
                    title={t('close')}
                    onClick={() => setNftAddFailed(false)}
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
                setNftAddFailed(false);
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
                setNftAddFailed(false);
              }}
              tooltipText={t('importNFTTokenIdToolTip')}
            />
          </Box>
        </Box>
      }
    />
  );
}
