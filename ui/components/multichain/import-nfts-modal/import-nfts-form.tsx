import { isValidHexAddress } from '@metamask/controller-utils';
import React, { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import {
  Box,
  Button,
  ButtonSize,
  HelpText,
  HelpTextSeverity,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Label,
  TextField,
  TextFieldSize,
} from '@metamask/design-system-react';
import { type Hex } from '@metamask/utils';
import {
  MetaMetricsEventName,
  MetaMetricsTokenEventSource,
} from '../../../../shared/constants/metametrics';
import { AssetType } from '../../../../shared/constants/transaction';
import { CHAIN_IDS, TEST_CHAINS } from '../../../../shared/constants/network';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { getNftsDropdownState } from '../../../ducks/metamask/metamask';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
  getSelectedNetworkClientId,
} from '../../../../shared/lib/selectors/networks';
import {
  getOpenSeaEnabled,
  getShouldShowTestNetworks,
  getUseExternalServices,
} from '../../../selectors';
import { getIsBasicFunctionalityConsolidationEnabled } from '../../../selectors/multichain/feature-flags';
import { getSelectedInternalAccount } from '../../../../shared/lib/selectors/accounts';
import {
  addNftVerifyOwnership,
  getTokenStandardAndDetails,
  ignoreTokens,
  updateNftDropDownState,
} from '../../../store/actions';
import { useDispatch } from '../../../store/hooks';
import NftsDetectionNoticeImportNFTs from '../../app/assets/nfts/nfts-detection-notice-import-nfts/nfts-detection-notice-import-nfts';
import Tooltip from '../../ui/tooltip';
import { useNftsCollections } from '../../../hooks/useNftsCollections';
import { checkTokenIdExists } from '../../../helpers/utils/util';
import { NetworkSelectorCustomImport } from '../../app/import-token/network-selector-custom-import';
import { endTrace, trace, TraceName } from '../../../../shared/lib/trace';
import { toast, ToastContent } from '../../ui/toast/toast';
import { CustomTokenImportNetworkSelector } from '../../../pages/custom-token-import/custom-token-import-network-selector';
import { Content } from '../pages/page';

type ImportNftsLocationState = {
  tokenAddress?: string;
  tokenId?: string;
  ignoreErc20Token?: boolean;
};

type NetworkConfiguration = {
  chainId: string;
  name: string;
  defaultRpcEndpointIndex: number;
  rpcEndpoints: { networkClientId: string }[];
};

export const ImportNftsForm = ({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) => {
  const t = useI18nContext();
  const location = useLocation();
  const dispatch = useDispatch();
  const isDisplayNFTMediaToggleEnabled = useSelector(getOpenSeaEnabled);
  const isBasicFunctionalityEnabled = useSelector(getUseExternalServices);
  const isBasicFunctionalityConsolidationEnabled = useSelector(
    getIsBasicFunctionalityConsolidationEnabled,
  );
  const showTestNetworks = useSelector(getShouldShowTestNetworks);
  const nftsDropdownState = useSelector(getNftsDropdownState);
  const selectedAccount = useSelector(getSelectedInternalAccount);
  const chainId = useSelector(getCurrentChainId);
  const networkClientId = useSelector(getSelectedNetworkClientId);
  const importNftsState = useSelector(
    (state: { appState: { importNftsModal: ImportNftsLocationState } }) =>
      state.appState.importNftsModal,
  );
  const routeState = (location.state ?? {}) as ImportNftsLocationState;
  const initialTokenAddress =
    routeState.tokenAddress ?? importNftsState.tokenAddress;
  const initialTokenId = routeState.tokenId ?? importNftsState.tokenId;
  const ignoreErc20Token =
    routeState.ignoreErc20Token ?? importNftsState.ignoreErc20Token;
  const existingNfts = useNftsCollections();
  const [nftAddress, setNftAddress] = useState(initialTokenAddress ?? '');
  const [tokenId, setTokenId] = useState(initialTokenId ?? '');
  const { trackEvent, createEventBuilder } = useAnalytics();
  const [isNetworkSelectorOpen, setIsNetworkSelectorOpen] = useState(false);

  const networkConfigurations = useSelector(
    getNetworkConfigurationsByChainId,
  ) as Record<string, NetworkConfiguration>;
  const currentNetwork = networkConfigurations[String(chainId)];
  const [selectedNetworkForCustomImport, setSelectedNetworkForCustomImport] =
    useState<string | null>(currentNetwork ? String(chainId) : null);
  const [
    selectedNetworkClientIdForCustomImport,
    setSelectedNetworkClientIdForCustomImport,
  ] = useState<string | null>(
    currentNetwork?.rpcEndpoints[currentNetwork.defaultRpcEndpointIndex]
      ?.networkClientId ?? null,
  );
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
            !TEST_CHAINS.includes(network.chainId as Hex),
        ),
    [chainId, networkConfigurations, showTestNetworks],
  );

  const [nftAddressValidationError, setNftAddressValidationError] = useState<
    string | null
  >(null);
  const [duplicateTokenIdError, setDuplicateTokenIdError] = useState<
    string | null
  >(null);

  const isFormDisabled =
    !selectedNetworkForCustomImport ||
    !isValidHexAddress(nftAddress) ||
    !tokenId ||
    Number.isNaN(Number(tokenId)) ||
    Boolean(nftAddressValidationError) ||
    Boolean(duplicateTokenIdError);

  const handleAddNft = async () => {
    if (!selectedNetworkClientIdForCustomImport || !selectedAccount) {
      return;
    }

    trace({ name: TraceName.ImportNfts });
    try {
      await dispatch(
        addNftVerifyOwnership(
          nftAddress,
          tokenId,
          selectedNetworkClientIdForCustomImport,
          false,
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
          tokensToIgnore: [nftAddress],
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

    const tokenDetails = (await Promise.race([
      getTokenStandardAndDetails(nftAddress, undefined, tokenId.toString()),
      new Promise((_, reject) =>
        setTimeout(
          () => reject(new Error('getTokenStandardAndDetails timeout')),
          3000,
        ),
      ),
    ]).catch(() => ({}))) as { symbol?: string; standard?: string };

    trackEvent(
      createEventBuilder(MetaMetricsEventName.TokenAdded)
        .addCategory('Wallet')
        .addSensitiveProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_contract_address: nftAddress,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_symbol: tokenDetails.symbol,
          tokenId: tokenId.toString(),
          // eslint-disable-next-line @typescript-eslint/naming-convention
          asset_type: AssetType.NFT,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          token_standard: tokenDetails.standard,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          source_connection_method: MetaMetricsTokenEventSource.Custom,
        })
        .build(),
    );

    onSuccess();
  };

  const getDuplicateTokenIdError = (address: string, tokenIdValue: string) => {
    if (!tokenIdValue || !isValidHexAddress(address)) {
      return null;
    }
    const tokenIdExists = checkTokenIdExists(
      address,
      tokenIdValue,
      existingNfts.collections,
    );
    return tokenIdExists ? t('nftAlreadyAdded') : null;
  };

  const handleAddressChange = (value: string) => {
    setNftAddress(value);
    setNftAddressValidationError(null);
    setDuplicateTokenIdError(getDuplicateTokenIdError(value, tokenId));
  };

  const handleAddressBlur = (value: string) => {
    if (value && !isValidHexAddress(value)) {
      setNftAddressValidationError(t('invalidAddress'));
    }
  };

  const handleTokenIdChange = (value: string) => {
    setTokenId(value);
    setDuplicateTokenIdError(null);
  };

  const handleTokenIdBlur = (value: string) => {
    setDuplicateTokenIdError(getDuplicateTokenIdError(nftAddress, value));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const duplicateError = getDuplicateTokenIdError(nftAddress, tokenId);
    if (duplicateError) {
      setDuplicateTokenIdError(duplicateError);
      return;
    }
    if (isFormDisabled) {
      return;
    }
    handleAddNft().catch(() => undefined);
  };

  const handleNetworkSelect = useCallback(() => {
    setIsNetworkSelectorOpen(true);
  }, []);

  const showNftDetectionNotice = isBasicFunctionalityConsolidationEnabled
    ? !isBasicFunctionalityEnabled
    : selectedNetworkForCustomImport === CHAIN_IDS.MAINNET &&
      !isDisplayNFTMediaToggleEnabled;

  const networkTitle = selectedNetworkForCustomImport
    ? networkConfigurations[selectedNetworkForCustomImport]?.name
    : t('networkMenuHeading');

  return (
    <>
      <Content padding={0}>
        <form
          className="flex min-h-0 w-full flex-1 flex-col justify-between"
          onSubmit={handleSubmit}
        >
          <Box className="min-h-0 flex-1 overflow-y-auto">
            <Box className="flex flex-col gap-6 p-4">
              {showNftDetectionNotice ? (
                <NftsDetectionNoticeImportNFTs onActionButtonClick={onClose} />
              ) : null}
              <Box>
                <Label className="mb-1">{t('network')}</Label>
                <NetworkSelectorCustomImport
                  title={networkTitle}
                  ariaLabel={`${t('network')}: ${networkTitle}`}
                  buttonDataTestId="test-import-tokens-drop-down-custom-import"
                  chainId={selectedNetworkForCustomImport ?? ''}
                  onSelectNetwork={handleNetworkSelect}
                />
              </Box>
              <Box>
                <Box className="mb-1 flex items-center">
                  <Label htmlFor="address">{t('address')}</Label>
                  <Tooltip
                    title={t('importNFTAddressToolTip')}
                    position="bottom"
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      className="ml-1"
                      color={IconColor.IconAlternative}
                    />
                  </Tooltip>
                </Box>
                <TextField
                  autoFocus
                  id="address"
                  placeholder="0x..."
                  size={TextFieldSize.Lg}
                  value={nftAddress}
                  onChange={(event) => {
                    handleAddressChange(event.target.value);
                  }}
                  onBlur={(event) => {
                    handleAddressBlur(event.target.value);
                  }}
                  isError={Boolean(nftAddressValidationError)}
                  className="w-full"
                  inputProps={
                    {
                      'data-testid': 'address',
                      'aria-describedby': nftAddressValidationError
                        ? 'import-nfts-address-error'
                        : undefined,
                    } as React.ComponentPropsWithoutRef<'input'>
                  }
                />
                {nftAddressValidationError ? (
                  <HelpText severity={HelpTextSeverity.Danger} asChild>
                    <span id="import-nfts-address-error">
                      {nftAddressValidationError}
                    </span>
                  </HelpText>
                ) : null}
              </Box>
              <Box>
                <Box className="mb-1 flex items-center">
                  <Label htmlFor="token-id">{t('tokenId')}</Label>
                  <Tooltip
                    title={t('importNFTTokenIdToolTip')}
                    position="bottom"
                  >
                    <Icon
                      name={IconName.Info}
                      size={IconSize.Sm}
                      className="ml-1"
                      color={IconColor.IconAlternative}
                    />
                  </Tooltip>
                </Box>
                <TextField
                  id="token-id"
                  placeholder={t('nftTokenIdPlaceholder')}
                  size={TextFieldSize.Lg}
                  value={tokenId}
                  onChange={(event) => {
                    handleTokenIdChange(event.target.value);
                  }}
                  onBlur={(event) => {
                    handleTokenIdBlur(event.target.value);
                  }}
                  isError={Boolean(duplicateTokenIdError)}
                  className="w-full"
                  inputProps={
                    {
                      'data-testid': 'token-id',
                      'aria-describedby': duplicateTokenIdError
                        ? 'import-nfts-token-id-error'
                        : undefined,
                    } as React.ComponentPropsWithoutRef<'input'>
                  }
                />
                {duplicateTokenIdError ? (
                  <HelpText severity={HelpTextSeverity.Danger} asChild>
                    <span id="import-nfts-token-id-error">
                      {duplicateTokenIdError}
                    </span>
                  </HelpText>
                ) : null}
              </Box>
            </Box>
          </Box>
          <Box
            padding={4}
            paddingBottom={6}
            className="cta-footer bg-background-default"
          >
            <Button
              size={ButtonSize.Lg}
              type="submit"
              isDisabled={isFormDisabled}
              isFullWidth
              data-testid="import-nfts-modal-import-button"
            >
              {t('save')}
            </Button>
          </Box>
        </form>
      </Content>
      <CustomTokenImportNetworkSelector
        isOpen={isNetworkSelectorOpen}
        networks={availableNetworks}
        selectedNetwork={selectedNetworkForCustomImport ?? ''}
        onBack={() => setIsNetworkSelectorOpen(false)}
        onClose={() => setIsNetworkSelectorOpen(false)}
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
          setNftAddressValidationError(null);
          setDuplicateTokenIdError(null);
          setIsNetworkSelectorOpen(false);
        }}
      />
    </>
  );
};
