import { isValidHexAddress } from '@metamask/controller-utils';
import PropTypes from 'prop-types';
import React, { useContext, useState, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
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
} from '../../../../shared/modules/selectors/networks';
import {
  getIsMainnet,
  getSelectedInternalAccount,
  getOpenSeaEnabled,
  getCurrentNetwork,
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
import NetworkFilterDropdown from '../../app/import-token/network-filter-import-token/network-filter-dropdown';
import { FEATURED_NETWORK_CHAIN_IDS } from '../../../../shared/constants/network';
import { NetworkListItem } from '../network-list-item';

export const ImportNftsModal = ({ onClose }) => {
  const t = useI18nContext();
  const history = useHistory();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);
  const isMainnet = useSelector(getIsMainnet);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
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

  const dropdown = useRef(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState(null);

  const currentNetwork = useSelector(getCurrentNetwork);
  const currentNetworkImageUrl = getImageForChainId(currentNetwork?.chainId);
  const allNetworks = useSelector(getNetworkConfigurationsByChainId);

  const allOpts = useMemo(
    () =>
      Object.keys(allNetworks || {}).reduce((acc, chain) => {
        acc[chain] = true;
        return acc;
      }, {}),
    [allNetworks],
  );

  const [nftAddressValidationError, setNftAddressValidationError] =
    useState(null);
  const [duplicateTokenIdError, setDuplicateTokenIdError] = useState(null);

  const handleAddNft = async () => {
    try {
      await dispatch(addNftVerifyOwnership(nftAddress, tokenId));
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
    }
    if (ignoreErc20Token && nftAddress) {
      await dispatch(
        ignoreTokens({
          tokensToIgnore: nftAddress,
          dontShowLoadingIndicator: true,
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

    history.push(DEFAULT_ROUTE);
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

  const toggleNetworkList = () => {
    setIsDropdownOpen(!isDropdownOpen);
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
            <NetworkFilterDropdown
              title="title"
              buttonDataTestId="buttonDataTestId"
              isCurrentNetwork={false}
              openListNetwork={toggleNetworkList}
              currentNetworkImageUrl={currentNetworkImageUrl}
              allOpts={allOpts}
              isDropdownOpen={isDropdownOpen}
              setIsDropdownOpen={setIsDropdownOpen}
              dropdownRef={dropdown}
            />

            {isDropdownOpen && (
              <Modal isOpen>
                <ModalOverlay />
                <ModalContent>
                  <ModalHeader onBack={toggleNetworkList} onClose={onClose}>
                    <Text
                      variant={TextVariant.headingSm}
                      align={TextAlign.Center}
                    >
                      {t('networkMenuHeading')}
                    </Text>
                  </ModalHeader>
                  <ModalBody>
                    <Box
                      display={Display.Flex}
                      flexDirection={FlexDirection.Column}
                      width={BlockSize.Full}
                    >
                      {Object.values(allNetworks).map((network) => (
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
                              setSelectedNetworkForCustomImport(
                                network.chainId,
                              );
                              // setCustomAddress('');
                              // setCustomSymbol('');
                              // setCustomDecimals(0);
                              // setShowSymbolAndDecimals(false);

                              // setActionMode(ACTION_MODES.IMPORT_TOKEN);
                            }}
                            selected={
                              network?.chainId ===
                              selectedNetworkForCustomImport
                            }
                          />
                        </Box>
                      ))}
                    </Box>
                  </ModalBody>
                </ModalContent>
              </Modal>
            )}
            <Box>
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
            <Box>
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
          paddingTop={4}
          paddingBottom={4}
        >
          <ButtonSecondary
            size={ButtonSecondarySize.Lg}
            onClick={() => onClose()}
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
