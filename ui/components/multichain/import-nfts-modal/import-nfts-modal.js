import { isValidHexAddress } from '@metamask/controller-utils';
import PropTypes from 'prop-types';
import React, { useContext, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { getErrorMessage } from '../../../../shared/modules/error';
import {
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Severity,
  Size,
  TextAlign,
  TextVariant,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../shared/modules/selectors/networks';
import {
  getIsMainnet,
  getSelectedInternalAccount,
  getOpenSeaEnabled,
} from '../../../selectors';
import { getImageForChainId } from '../../../selectors/multichain';
import {
  addNftVerifyOwnership,
  getTokenStandardAndDetails,
  ignoreTokens,
  setNewNftAddedMessage,
  updateNftDropDownState,
} from '../../../store/actions';
import NftsDetectionNoticeImportNFTs from '../../app/assets/nfts/nfts-detection-notice-import-nfts/nfts-detection-notice-import-nfts';
import {
  BannerAlert,
  Box,
  ButtonPrimary,
  ButtonSecondary,
  ButtonSecondarySize,
  Icon,
  IconName,
  IconSize,
  Label,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  Text,
  AvatarNetworkSize,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import Tooltip from '../../ui/tooltip';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { checkTokenIdExists } from '../../../helpers/utils/util';
import { NetworkListItem } from '../network-list-item';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';

const ACTION_MODES = {
  // Displays the import nft modal
  IMPORT_TOKEN: 'IMPORT_NFT',
  // Displays the page for selecting a network from custom import
  NETWORK_SELECTOR: 'NETWORK_SELECTOR',
};

export const ImportNftsModal = ({ onClose }) => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);
  const isMainnet = useSelector(getIsMainnet);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const {
    tokenAddress: initialTokenAddress,
    tokenId: initialTokenId,
    ignoreErc20Token,
  } = useSelector((state) => state.appState.importNftsModal);
  const existingNfts = useNftsCollections();
  const [nftAddress, setNftAddress] = useState(initialTokenAddress ?? '');
  const [tokenId, setTokenId] = useState(initialTokenId ?? '');
  const [disabled, setDisabled] = useState(true);
  const [nftAddFailed, setNftAddFailed] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  const [actionMode, setActionMode] = useState(ACTION_MODES.IMPORT_NFT);

  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState(null);
  const [selectedNetworkClientId, setSelectedNetworkClientIdForCustomImport] =
    useState(null);

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);

  const [nftAddressValidationError, setNftAddressValidationError] =
    useState(null);
  const [duplicateTokenIdError, setDuplicateTokenIdError] = useState(null);

  const handleAddNft = async () => {
    trace({ name: TraceName.ImportNfts });
    try {
      await dispatch(
        // selectedNetworkClientId is for the network the NFT is on, not the globally selected network of the wallet
        addNftVerifyOwnership(nftAddress, tokenId, selectedNetworkClientId),
      );
      const newNftDropdownState = {
        ...nftsDropdownState,
        [selectedAccount.address]: {
          ...nftsDropdownState?.[selectedAccount.address],
          [chainId]: {
            ...nftsDropdownState?.[selectedAccount.address]?.[chainId],
            [nftAddress]: true,
          },
        },
      };

      dispatch(updateNftDropDownState(newNftDropdownState));
    } catch (error) {
      const message = getErrorMessage(error);
      dispatch(setNewNftAddedMessage(message));
      setNftAddFailed(true);
      return;
    } finally {
      endTrace({ name: TraceName.ImportNfts });
    }

    if (ignoreErc20Token && nftAddress) {
      await dispatch(
        ignoreTokens({
          tokensToIgnore: nftAddress,
          dontShowLoadingIndicator: true,
          networkClientId,
        }),
      );
    }
    dispatch(setNewNftAddedMessage('success'));

    const tokenDetails = await getTokenStandardAndDetails(
      nftAddress,
      null,
      tokenId.toString(),
    ).catch(() => ({}));

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

    navigate(DEFAULT_ROUTE);
    onClose();
  };

  const validateAndSetAddress = (val) => {
    setNftAddressValidationError(null);
    if (val && !isValidHexAddress(val)) {
      setNftAddressValidationError(t('invalidAddress'));
    }
    setDisabled(!isValidHexAddress(val) || !tokenId);
    setNftAddress(val);
  };

  const validateAndSetTokenId = (val) => {
    setDuplicateTokenIdError(null);
    // Check if tokenId is already imported
    const tokenIdExists = checkTokenIdExists(
      nftAddress,
      val,
      existingNfts.collections,
    );
    if (tokenIdExists) {
      setDuplicateTokenIdError(t('nftAlreadyAdded'));
    }
    setDisabled(
      !isValidHexAddress(nftAddress) ||
        !val ||
        isNaN(Number(val)) ||
        tokenIdExists,
    );

    setTokenId(val);
  };

  const handleNetworkSelect = useCallback(() => {
    setActionMode(ACTION_MODES.NETWORK_SELECTOR);
  }, []);

  if (actionMode === ACTION_MODES.NETWORK_SELECTOR) {
    return (
      <Modal isOpen>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader
            onBack={() => setActionMode(ACTION_MODES.IMPORT_NFT)}
            onClose={() => onClose()}
          >
            <Text variant={TextVariant.headingSm} align={TextAlign.Center}>
              {t('networkMenuHeading')}
            </Text>
          </ModalHeader>
          <ModalBody>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              width={BlockSize.Full}
            >
              {Object.values(networkConfigurations).map((network) => (
                <Box
                  key={network.chainId}
                  data-testid={`select-network-item-${network.chainId}`}
                >
                  <NetworkListItem
                    key={network.chainId}
                    chainId={network.chainId}
                    name={network.name}
                    iconSrc={getImageForChainId(network.chainId)}
                    iconSize={AvatarNetworkSize.Sm}
                    focus={false}
                    onClick={() => {
                      const nftNetworkClientId =
                        network.rpcEndpoints[network.defaultRpcEndpointIndex]
                          .networkClientId;
                      setSelectedNetworkForCustomImport(network.chainId);
                      setSelectedNetworkClientIdForCustomImport(
                        nftNetworkClientId,
                      );
                      setNftAddress('');
                      setTokenId('');

                      setActionMode(ACTION_MODES.IMPORT_TOKEN);
                    }}
                    selected={
                      network?.chainId === selectedNetworkForCustomImport
                    }
                  />
                </Box>
              ))}
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    );
  }

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
            navigate(DEFAULT_ROUTE);
          }}
        >
          {t('importNFT')}
        </ModalHeader>
        <Box>
          {isMainnet && !isDisplayNFTMediaToggleEnabled ? (
            <Box marginTop={6}>
              <NftsDetectionNoticeImportNFTs onActionButtonClick={onClose} />
            </Box>
          ) : null}
          {nftAddFailed && (
            <Box marginTop={6}>
              <BannerAlert
                severity={Severity.Danger}
                onClose={() => setNftAddFailed(false)}
                closeButtonProps={{ 'data-testid': 'add-nft-error-close' }}
              >
                {t('nftAddFailedMessage')}
              </BannerAlert>
            </Box>
          )}
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={6}
            marginTop={6}
            marginBottom={6}
          >
            <NetworkSelectorCustomImport
              title={
                selectedNetworkForCustomImport
                  ? networkConfigurations[selectedNetworkForCustomImport]?.name
                  : t('networkMenuHeading')
              }
              buttonDataTestId="test-import-tokens-drop-down-custom-import"
              chainId={selectedNetworkForCustomImport}
              onSelectNetwork={handleNetworkSelect}
            />
            <Box marginRight={4} marginLeft={4}>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.flexEnd}
              >
                <Box display={Display.Flex} alignItems={AlignItems.center}>
                  <Label htmlFor="address">{t('address')}</Label>
                  <Tooltip
                    title={t('importNFTAddressToolTip')}
                    position="bottom"
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      marginLeft={1}
                      color={IconColor.iconAlternative}
                    />
                  </Tooltip>
                </Box>
              </Box>
              <FormTextField
                autoFocus
                dataTestId="address"
                id="address"
                placeholder="0x..."
                value={nftAddress}
                onChange={(e) => {
                  validateAndSetAddress(e.target.value);
                  setNftAddFailed(false);
                }}
                helpText={nftAddressValidationError}
                error={Boolean(nftAddressValidationError)}
              />
            </Box>
            <Box marginRight={4} marginLeft={4}>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.flexEnd}
              >
                <Box display={Display.Flex} alignItems={AlignItems.center}>
                  <Label htmlFor="token-id">{t('tokenId')}</Label>
                  <Tooltip
                    title={t('importNFTTokenIdToolTip')}
                    position="bottom"
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      marginLeft={1}
                      color={IconColor.iconAlternative}
                    />
                  </Tooltip>
                </Box>
              </Box>
              <FormTextField
                dataTestId="token-id"
                id="token-id"
                placeholder={t('nftTokenIdPlaceholder')}
                value={tokenId}
                onChange={(e) => {
                  validateAndSetTokenId(e.target.value);
                  setNftAddFailed(false);
                }}
                helpText={duplicateTokenIdError}
                error={duplicateTokenIdError}
              />
            </Box>
          </Box>
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Row}
          justifyContent={JustifyContent.spaceBetween}
          gap={4}
          padding={4}
        >
          <ButtonSecondary
            size={ButtonSecondarySize.Lg}
            onClick={() => {
              onClose();
              navigate(DEFAULT_ROUTE);
            }}
            block
            className="import-nfts-modal__cancel-button"
          >
            {t('cancel')}
          </ButtonSecondary>
          <ButtonPrimary
            size={Size.LG}
            onClick={() => handleAddNft()}
            disabled={disabled}
            block
            data-testid="import-nfts-modal-import-button"
          >
            {t('import')}
          </ButtonPrimary>
        </Box>
      </ModalContent>
    </Modal>
  );
};

ImportNftsModal.propTypes = {
  /**
   * Executes when the modal closes
   */
  onClose: PropTypes.func.isRequired,
};
