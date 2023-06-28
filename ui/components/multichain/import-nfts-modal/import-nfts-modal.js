import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { isValidHexAddress } from '@metamask/controller-utils';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import {
  Display,
  FlexDirection,
  FONT_WEIGHT,
  JustifyContent,
  TypographyVariant,
} from '../../../helpers/constants/design-system';

import Typography from '../../ui/typography';
import ActionableMessage from '../../ui/actionable-message';
import {
  addNftVerifyOwnership,
  getTokenStandardAndDetails,
  ignoreTokens,
  setNewNftAddedMessage,
  updateNftDropDownState,
} from '../../../store/actions';
import FormField from '../../ui/form-field';
import {
  getCurrentChainId,
  getIsMainnet,
  getSelectedAddress,
  getUseNftDetection,
} from '../../../selectors';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import NftsDetectionNotice from '../../app/nfts-detection-notice';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import {
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import {
  ButtonIcon,
  IconName,
  ButtonIconSize,
  ModalContent,
  ModalOverlay,
  ModalHeader,
  Modal,
  ButtonPrimary,
  ButtonSecondary,
  Box,
} from '../../component-library';

export const ImportNftsModal = ({ onClose }) => {
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
  const [disabled, setDisabled] = useState(true);
  const [nftAddFailed, setNftAddFailed] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

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
        source_connection_method: MetaMetricsTokenEventSource.Custom,
      },
    });

    history.push(DEFAULT_ROUTE);
  };

  const validateAndSetAddress = (val) => {
    setDisabled(!isValidHexAddress(val) || !tokenId);
    setNftAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDisabled(!isValidHexAddress(nftAddress) || !val || isNaN(Number(val)));
    setTokenId(val);
  };

  return (
    <Modal
      isOpen
      onClose={() => {
        onClose();
      }}
      className="import-nfts-modal"
    >
      <ModalOverlay />
      <ModalContent>
        <ModalHeader
          onClose={() => {
            onClose();
          }}
        >
          {t('importNFT')}
        </ModalHeader>
        <Box>
          {isMainnet && !useNftDetection ? <NftsDetectionNotice /> : null}
          {nftAddFailed && (
            <Box marginLeft={4} marginRight={4}>
              <ActionableMessage
                type="danger"
                useIcon
                iconFillColor="var(--color-error-default)"
                message={
                  <Box display={Display.InlineFlex}>
                    <Typography
                      variant={TypographyVariant.H7}
                      fontWeight={FONT_WEIGHT.NORMAL}
                      marginTop={0}
                    >
                      {t('nftAddFailedMessage')}
                    </Typography>
                    <ButtonIcon
                      className="add-nft__close"
                      iconName={IconName.Close}
                      size={ButtonIconSize.Sm}
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
              value={tokenId}
              onChange={(val) => {
                validateAndSetTokenId(val);
                setNftAddFailed(false);
              }}
              tooltipText={t('importNFTTokenIdToolTip')}
            />
          </Box>
        </Box>
        <Box
          padding={6}
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          gap={4}
        >
          <ButtonSecondary onClick={() => onClose()} block>
            {t('cancel')}
          </ButtonSecondary>
          <ButtonPrimary
            onClick={() => handleAddNft()}
            disabled={disabled}
            block
          >
            {t('add')}
          </ButtonPrimary>
        </Box>
      </ModalContent>
    </Modal>
  );
};

ImportNftsModal.propTypes = {
  onClose: PropTypes.func.isRequired,
};
