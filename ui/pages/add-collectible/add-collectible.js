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
  setNewCollectibleAddedMessage,
  updateCollectibleDropDownState,
} from '../../store/actions';
import FormField from '../../components/ui/form-field';
import {
  getCurrentChainId,
  getIsMainnet,
  getSelectedAddress,
  getUseNftDetection,
} from '../../selectors';
import { getCollectiblesDropdownState } from '../../ducks/metamask/metamask';
import CollectiblesDetectionNotice from '../../components/app/collectibles-detection-notice';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { AssetType } from '../../../shared/constants/transaction';
import { EVENT, EVENT_NAMES } from '../../../shared/constants/metametrics';

export default function AddCollectible() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const collectiblesDropdownState = useSelector(getCollectiblesDropdownState);
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const addressEnteredOnImportTokensPage =
    history?.location?.state?.addressEnteredOnImportTokensPage;
  const contractAddressToConvertFromTokenToCollectible =
    history?.location?.state?.tokenAddress;

  const [collectibleAddress, setCollectibleAddress] = useState(
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
      await dispatch(addNftVerifyOwnership(collectibleAddress, tokenId));
      const newCollectibleDropdownState = {
        ...collectiblesDropdownState,
        [selectedAddress]: {
          ...collectiblesDropdownState?.[selectedAddress],
          [chainId]: {
            ...collectiblesDropdownState?.[selectedAddress]?.[chainId],
            [collectibleAddress]: true,
          },
        },
      };

      dispatch(updateCollectibleDropDownState(newCollectibleDropdownState));
    } catch (error) {
      const { message } = error;
      dispatch(setNewCollectibleAddedMessage(message));
      setCollectibleAddFailed(true);
      return;
    }
    if (contractAddressToConvertFromTokenToCollectible) {
      await dispatch(
        ignoreTokens({
          tokensToIgnore: contractAddressToConvertFromTokenToCollectible,
          dontShowLoadingIndicator: true,
        }),
      );
    }
    dispatch(setNewCollectibleAddedMessage('success'));

    const tokenDetails = await getTokenStandardAndDetails(
      collectibleAddress,
      null,
      tokenId.toString(),
    );

    trackEvent({
      event: EVENT_NAMES.TOKEN_ADDED,
      category: 'Wallet',
      sensitiveProperties: {
        token_contract_address: collectibleAddress,
        token_symbol: tokenDetails?.symbol,
        tokenId: tokenId.toString(),
        asset_type: AssetType.NFT,
        token_standard: tokenDetails?.standard,
        source: EVENT.SOURCE.TOKEN.CUSTOM,
      },
    });

    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!isValidHexAddress(val) || !tokenId);
    setCollectibleAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDisabled(
      !isValidHexAddress(collectibleAddress) || !val || isNaN(Number(val)),
    );
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
          {isMainnet && !useNftDetection ? (
            <CollectiblesDetectionNotice />
          ) : null}
          {collectibleAddFailed && (
            <Box marginLeft={4} marginRight={4}>
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
            </Box>
          )}
          <Box margin={4}>
            <FormField
              dataTestId="address"
              titleText={t('address')}
              placeholder="0x..."
              value={collectibleAddress}
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
