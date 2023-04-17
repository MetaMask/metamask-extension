import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isValidHexAddress } from '@metamask/controller-utils';
import { useI18nContext } from '../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import {
  DISPLAY,
  FONT_WEIGHT,
  TypographyVariant,
  TextVariant,
} from '../../helpers/constants/design-system';

import Box from '../../components/ui/box';
import Typography from '../../components/ui/typography';
import ActionableMessage from '../../components/ui/actionable-message';
import PageContainer from '../../components/ui/page-container';
import {
  addNftVerifyOwnership,
  addMultipleNftsVerifyOwnership,
  getTokenStandardAndDetails,
  getMultipleTokenStandardAndDetails,
  ignoreTokens,
  setNewNftAddedMessage,
  updateNftDropDownState,
} from '../../store/actions';
import FormField from '../../components/ui/form-field';
import {
  getCurrentChainId,
  getIsMainnet,
  getSelectedAddress,
  getUseNftDetection,
} from '../../selectors';
import { getNftsDropdownState } from '../../ducks/metamask/metamask';
import NftsDetectionNotice from '../../components/app/nfts-detection-notice';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { AssetType } from '../../../shared/constants/transaction';
import {
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../shared/constants/metametrics';
import {
  ICON_NAMES,
  ICON_SIZES,
} from '../../components/component-library/icon/deprecated';
import { ButtonIcon } from '../../components/component-library/button-icon/deprecated';
import Checkbox from '../../components/ui/check-box';
import { Text } from '../../components/component-library';

export default function AddNft() {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const useNftDetection = useSelector(getUseNftDetection);
  const isMainnet = useSelector(getIsMainnet);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const selectedAddress = useSelector(getSelectedAddress);
  const chainId = useSelector(getCurrentChainId);
  const addressEnteredOnImportTokensPage =
    history?.location?.state?.addressEnteredOnImportTokensPage;
  const contractAddressToConvertFromTokenToNft =
    history?.location?.state?.tokenAddress;

  const [nftAddress, setNftAddress] = useState(
    addressEnteredOnImportTokensPage ??
      contractAddressToConvertFromTokenToNft ??
      '',
  );
  const [tokenId, setTokenId] = useState('');
  const [multipleTokenIds, setMultipleTokenIds] = useState(['']);
  const [disabled, setDisabled] = useState(true);
  const [nftAddFailed, setNftAddFailed] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  const [checkMultiNFT, setCheckMultiNFT] = useState(false);

  const handleAddNft = async () => {
    try {
      await dispatch(addNftVerifyOwnership(nftAddress, tokenId));
      const newNftDropdownState = {
        ...nftsDropdownState,
        [selectedAddress]: {
          ...nftsDropdownState?.[selectedAddress],
          [chainId]: {
            ...nftsDropdownState?.[selectedAddress]?.[chainId],
            [nftAddress]: true,
          },
        },
      };

      dispatch(updateNftDropDownState(newNftDropdownState));
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
      nftAddress,
      null,
      tokenId.toString(),
    );

    trackEvent({
      event: MetaMetricsEventName.TokenAdded,
      category: 'Wallet',
      sensitiveProperties: {
        token_contract_address: nftAddress,
        token_symbol: tokenDetails?.symbol,
        tokenId: tokenId.toString(),
        asset_type: AssetType.NFT,
        token_standard: tokenDetails?.standard,
        source: MetaMetricsTokenEventSource.Custom,
      },
    });

    history.push(DEFAULT_ROUTE);
  };

  const handleAddMultipleNft = async () => {
    try {
      await dispatch(
        addMultipleNftsVerifyOwnership(nftAddress, multipleTokenIds),
      );
      const newNftDropdownState = {
        ...nftsDropdownState,
        [selectedAddress]: {
          ...nftsDropdownState?.[selectedAddress],
          [chainId]: {
            ...nftsDropdownState?.[selectedAddress]?.[chainId],
            [nftAddress]: true,
          },
        },
      };

      dispatch(updateNftDropDownState(newNftDropdownState));
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

    const tokenDetailsArray = await getMultipleTokenStandardAndDetails(
      nftAddress,
      null,
      multipleTokenIds,
    );

    tokenDetailsArray.forEach((tokenDetails, index) => {
      trackEvent({
        event: MetaMetricsEventName.TokenAdded,
        category: 'Wallet',
        sensitiveProperties: {
          token_contract_address: nftAddress,
          token_symbol: tokenDetails?.symbol,
          tokenId: multipleTokenIds[index].toString(),
          asset_type: AssetType.NFT,
          token_standard: tokenDetails?.standard,
          source: MetaMetricsTokenEventSource.Custom,
        },
      });
    });

    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!isValidHexAddress(val) || !tokenId);
    setNftAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    checkMultiNFT
      ? validateAndSetMultiTokenId(val)
      : validateAndSetSingleTokenId(val);
  };

  const validateAndSetSingleTokenId = (val) => {
    setDisabled(!isValidHexAddress(nftAddress) || !val || isNaN(Number(val)));
    setTokenId(val);
  };

  const validateAndSetMultiTokenId = (val) => {
    const tokens = val.split(',');
    setDisabled(
      !isValidHexAddress(nftAddress) ||
        !tokens ||
        tokens.some(
          (token) => token.trim().length === 0 || isNaN(Number(token)),
        ),
    );
    setMultipleTokenIds(tokens);
  };

  return (
    <PageContainer
      title={t('importNFT')}
      onSubmit={() => {
        checkMultiNFT ? handleAddMultipleNft() : handleAddNft();
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
          {isMainnet && !useNftDetection ? <NftsDetectionNotice /> : null}
          {nftAddFailed && (
            <Box marginLeft={4} marginRight={4}>
              <ActionableMessage
                type="danger"
                useIcon
                iconFillColor="var(--color-error-default)"
                message={
                  <Box display={DISPLAY.INLINE_FLEX}>
                    <Typography
                      variant={TypographyVariant.H7}
                      fontWeight={FONT_WEIGHT.NORMAL}
                      marginTop={0}
                    >
                      {t('nftAddFailedMessage')}
                    </Typography>
                    <ButtonIcon
                      className="add-nft__close"
                      iconName={ICON_NAMES.CLOSE}
                      size={ICON_SIZES.SM}
                      ariaLabel={t('close')}
                      data-testid="add-nft-error-close"
                      onClick={() => setNftAddFailed(false)}
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
              value={nftAddress}
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
              value={checkMultiNFT ? multipleTokenIds : tokenId}
              onChange={(val) => {
                validateAndSetTokenId(val);
                setNftAddFailed(false);
              }}
              tooltipText={t('importNFTTokenIdToolTip')}
            />
            <Text variant={TextVariant.bodySm}>Add multiple NFT</Text>
            <Checkbox
              id="multipleNFTCheckbox"
              checked={checkMultiNFT}
              className="unconnected-account-alert__checkbox"
              onClick={() => setCheckMultiNFT((checked) => !checked)}
              title={"Add multiple NFT's"}
            />
          </Box>
        </Box>
      }
    />
  );
}
