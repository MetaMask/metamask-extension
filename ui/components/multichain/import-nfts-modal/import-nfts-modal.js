import { isValidHexAddress } from '@metamask/controller-utils';
import PropTypes from 'prop-types';
import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import {
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { TEST_CHAINS } from '../../../../shared/constants/network';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  Size,
} from '../../../helpers/constants/design-system';
import { DEFAULT_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../shared/lib/selectors/networks';
import {
  getIsMainnet,
  getOpenSeaEnabled,
  getShowTestNetworks,
} from '../../../selectors';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import {
  addNftVerifyOwnership,
  getTokenStandardAndDetails,
  ignoreTokens,
  updateNftDropDownState,
} from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import NftsDetectionNoticeImportNFTs from '../../app/assets/nfts/nfts-detection-notice-import-nfts/nfts-detection-notice-import-nfts';
import {
  Box,
  Icon,
  IconName,
  IconSize,
  Label,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
} from '../../component-library';
import { FormTextField } from '../../component-library/form-text-field/deprecated';
import Tooltip from '../../ui/tooltip';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { checkTokenIdExists } from '../../../helpers/utils/util';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { toast, ToastContent } from '../../ui/toast/toast';
import { CustomTokenImportNetworkSelector } from '../../../pages/custom-token-import/custom-token-import-network-selector';

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
  const showTestNetworks = useSelector(getShowTestNetworks);
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
  const { trackEvent, createEventBuilder } = useAnalytics();

  const [actionMode, setActionMode] = useState(ACTION_MODES.IMPORT_NFT);

  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState(null);
  const [
    selectedNetworkClientIdForCustomImport,
    setSelectedNetworkClientIdForCustomImport,
  ] = useState(null);

  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const availableNetworks = useMemo(
    () =>
      Object.values(networkConfigurations)
        .map((network) => ({
          chainId: network.chainId,
          name: network.name,
        }))
        .filter(
          (network) =>
            network.chainId === chainId ||
            showTestNetworks ||
            !TEST_CHAINS.includes(network.chainId),
        ),
    [chainId, networkConfigurations, showTestNetworks],
  );

  const [nftAddressValidationError, setNftAddressValidationError] =
    useState(null);
  const [duplicateTokenIdError, setDuplicateTokenIdError] = useState(null);

  const isFormDisabled =
    !selectedNetworkForCustomImport ||
    !isValidHexAddress(nftAddress) ||
    !tokenId ||
    Number.isNaN(Number(tokenId)) ||
    Boolean(nftAddressValidationError) ||
    Boolean(duplicateTokenIdError);

  const handleAddNft = async () => {
    trace({ name: TraceName.ImportNfts });
    try {
      await dispatch(
        addNftVerifyOwnership(
          nftAddress,
          tokenId,
          selectedNetworkClientIdForCustomImport,
        ),
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
    } catch {
      toast.error(
        <ToastContent
          dataTestId="nft-import-error-toast"
          title={t('nftAddFailedMessage')}
        />,
      );
      return;
    } finally {
      endTrace({ name: TraceName.ImportNfts });
    }

    if (ignoreErc20Token && nftAddress) {
      dispatch(
        ignoreTokens({
          tokensToIgnore: nftAddress,
          dontShowLoadingIndicator: true,
          networkClientId,
        }),
      );
    }
    toast.success(
      <ToastContent
        dataTestId="nft-import-success-toast"
        title={t('newNftAddedMessage')}
      />,
    );

    const tokenDetails = await Promise.race([
      getTokenStandardAndDetails(nftAddress, null, tokenId.toString()),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('getTokenStandardAndDetails timeout')),
          3000,
        ),
      ),
    ]).catch(() => ({}));

    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenAdded)
        .addCategory('Wallet')
        .addSensitiveProperties({
          token_contract_address: nftAddress,
          token_symbol: tokenDetails?.symbol,
          tokenId: tokenId.toString(),
          asset_type: AssetType.NFT,
          token_standard: tokenDetails?.standard,
          source_connection_method: MetaMetricsTokenEventSource.Custom,
        })
        .build(),
    );

    onClose();
  };

  const validateAndSetAddress = (val) => {
    setNftAddressValidationError(null);
    if (val && !isValidHexAddress(val)) {
      setNftAddressValidationError(t('invalidAddress'));
    }
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
    setTokenId(val);
  };

  const handleNetworkSelect = useCallback(() => {
    setActionMode(ACTION_MODES.NETWORK_SELECTOR);
  }, []);

  if (actionMode === ACTION_MODES.NETWORK_SELECTOR) {
    return (
      <CustomTokenImportNetworkSelector
        isOpen
        networks={availableNetworks}
        selectedNetwork={selectedNetworkForCustomImport}
        onBack={() => setActionMode(ACTION_MODES.IMPORT_NFT)}
        onClose={onClose}
        onSelectNetwork={(network) => {
          const networkConfiguration = networkConfigurations[network.chainId];
          const nftNetworkClientId =
            networkConfiguration.rpcEndpoints[
              networkConfiguration.defaultRpcEndpointIndex
            ].networkClientId;
          setSelectedNetworkForCustomImport(network.chainId);
          setSelectedNetworkClientIdForCustomImport(nftNetworkClientId);
          setNftAddress('');
          setTokenId('');

          setActionMode(ACTION_MODES.IMPORT_TOKEN);
        }}
      />
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
      <ModalContent modalDialogProps={{ padding: 0 }}>
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
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            gap={6}
            padding={4}
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
            <Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.flexEnd}
                marginBottom={1}
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
                size={Size.LG}
                value={nftAddress}
                onChange={(e) => {
                  validateAndSetAddress(e.target.value);
                }}
                helpText={nftAddressValidationError}
                error={Boolean(nftAddressValidationError)}
                textFieldProps={{
                  backgroundColor: BackgroundColor.backgroundMuted,
                  borderColor: BorderColor.borderDefault,
                  borderRadius: BorderRadius.XL,
                }}
              />
            </Box>
            <Box>
              <Box
                display={Display.Flex}
                justifyContent={JustifyContent.spaceBetween}
                alignItems={AlignItems.flexEnd}
                marginBottom={1}
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
                size={Size.LG}
                value={tokenId}
                onChange={(e) => {
                  validateAndSetTokenId(e.target.value);
                }}
                helpText={duplicateTokenIdError}
                error={duplicateTokenIdError}
                textFieldProps={{
                  backgroundColor: BackgroundColor.backgroundMuted,
                  borderColor: BorderColor.borderDefault,
                  borderRadius: BorderRadius.XL,
                }}
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
          paddingBottom={0}
        >
          <Button
            variant={ButtonVariant.Secondary}
            size={ButtonSize.Lg}
            onClick={() => {
              onClose();
              navigate(DEFAULT_ROUTE);
            }}
            className="import-nfts-modal__cancel-button flex-1 rounded-xl"
          >
            {t('cancel')}
          </Button>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            onClick={() => handleAddNft()}
            isDisabled={isFormDisabled}
            className="flex-1 rounded-xl"
            data-testid="import-nfts-modal-import-button"
          >
            {t('import')}
          </Button>
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
