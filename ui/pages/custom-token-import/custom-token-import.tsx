import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { formatChainIdToHex } from '@metamask/bridge-controller';
import {
  ButtonIcon,
  ButtonIconSize,
  IconName,
} from '@metamask/design-system-react';
import { ERC20, ERC721, ERC1155 } from '@metamask/controller-utils';
import { NON_EVM_TESTNET_IDS } from '@metamask/multichain-network-controller';
import { type CaipChainId, type Hex } from '@metamask/utils';
import { isValidHexAddress } from '../../../shared/lib/hexstring-utils';
import { addHexPrefix } from '../../../shared/lib/add-hex-prefix';

import { useI18nContext } from '../../hooks/useI18nContext';
import { Header, Page } from '../../components/multichain/pages/page';
import {
  addImportedTokens,
  getTokenStandardAndDetailsByChain,
  importCustomAssetsBatch,
} from '../../store/actions';
import {
  TOKEN_MANAGEMENT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getAllNetworkConfigurationsByCaipChainId,
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../shared/lib/selectors/networks';
import {
  getInternalAccounts,
  getSelectedEvmInternalAccount,
  getAllTokens,
  selectERC20TokensByChain,
} from '../../selectors';
import { getIsAssetsUnifyStateEnabled } from '../../selectors/assets-unify-state/feature-flags';
import {
  getAssetsControllerAssetPreferences,
  isAssetIdHiddenInPreferencesMap,
} from '../../selectors/assets-unify-state/asset-preferences';
import { checkExistingAddresses } from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { isEvmChainId, toAssetId } from '../../../shared/lib/asset-utils';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { AssetType } from '../../../shared/constants/transaction';
import { MetaMetricsContext } from '../../contexts/metametrics';
import { type CustomTokenImportNetworkOption } from './custom-token-import-network-selector';
import { CustomTokenImportForm } from './custom-token-import-form';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MIN_DECIMAL_VALUE = 0;
const MAX_DECIMAL_VALUE = 36;
const CUSTOM_TOKEN_IMPORT_DEFAULT_VIEW_STATE = 'default';
const CUSTOM_TOKEN_IMPORT_LOOKUP_FAILED_VIEW_STATE = 'lookup_failed';
const METRICS_PROPERTIES = {
  addedToken: 'added_token',
  assetType: 'asset_type',
  chainId: 'chain_id',
  clickedSecurityLink: 'clicked_security_link',
  tokenContractAddress: 'token_contract_address',
  tokenStandard: 'token_standard',
  tokenSymbol: 'token_symbol',
  viewState: 'view_state',
} as const;

type TokenMetadataSource = {
  symbol?: string | null;
  name?: string | null;
  decimals?: string | number | null;
};

function trimImportedTokenField(value: unknown): string {
  if (value === undefined || value === null) {
    return '';
  }
  return String(value).trim();
}

/**
 * Merges on-chain RPC metadata with token-list lookup for the import form.
 *
 * Prefer RPC first, then the token list. RPC-first avoids empty strings or a
 * placeholder `decimals` of `'0'` from the list shadowing real contract
 * values. When RPC omits a field (e.g. `name`), the list value is still used.
 *
 * @param rpcTokenInfo - Result from {@link getTokenStandardAndDetailsByChain}.
 * @param info - Result from {@link tokenInfoGetter} for the current network.
 */
export function mergeCustomTokenMetadataForImport(
  rpcTokenInfo: TokenMetadataSource | undefined,
  info: TokenMetadataSource | undefined,
): { symbol: string; name: string; decimals: string } {
  const symbol =
    trimImportedTokenField(rpcTokenInfo?.symbol) ||
    trimImportedTokenField(info?.symbol);
  const name =
    trimImportedTokenField(rpcTokenInfo?.name) ||
    trimImportedTokenField(info?.name);
  const decimals =
    trimImportedTokenField(rpcTokenInfo?.decimals) ||
    trimImportedTokenField(info?.decimals);
  return { symbol, name, decimals };
}

/**
 * Full-screen "Add a custom token" page.
 */
export const CustomTokenImportPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { trackEvent } = useContext(MetaMetricsContext);

  const currentChainId = useSelector(getCurrentChainId) as Hex;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const allNetworkConfigurations = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const internalAccounts = useSelector(getInternalAccounts) as {
    address: string;
  }[];
  const allTokens = useSelector(getAllTokens) as Record<
    string,
    Record<string, { address: string }[]>
  >;
  const assetsUnifyStateFeatureEnabled = useSelector(
    getIsAssetsUnifyStateEnabled,
  );
  const assetPreferences = useSelector(getAssetsControllerAssetPreferences);
  // Chain-scoped token-list cache, same source the backend uses inside
  // `getTokenStandardAndDetailsByChain`. Provides the metadata fallback for
  // `tokenInfoGetter` when on-chain `symbol()`/`decimals()`/`name()` calls
  // can't return a value.
  const erc20TokensByChain = useSelector(selectERC20TokensByChain) as Record<
    string,
    { data?: Record<string, unknown> } | undefined
  >;

  const [selectedNetwork, setSelectedNetwork] =
    useState<string>(currentChainId);

  const availableNetworks = useMemo<CustomTokenImportNetworkOption[]>(
    () =>
      Object.entries(allNetworkConfigurations)
        .filter(
          ([caipChainId]) =>
            !NON_EVM_TESTNET_IDS.includes(caipChainId as CaipChainId),
        )
        .map(([, network]) => ({
          chainId: network.chainId,
          name: network.name,
        })),
    [allNetworkConfigurations],
  );

  const selectedNetworkConfig = useMemo(
    () =>
      Object.values(allNetworkConfigurations).find(
        (network) => network.chainId === selectedNetwork,
      ),
    [allNetworkConfigurations, selectedNetwork],
  );

  const networkName = selectedNetworkConfig?.name ?? t('currentNetwork');
  const networkClientId = isEvmChainId(selectedNetwork as CaipChainId | Hex)
    ? networkConfigurations?.[selectedNetwork as Hex]?.rpcEndpoints?.[
        networkConfigurations?.[selectedNetwork as Hex]
          ?.defaultRpcEndpointIndex ?? 0
      ]?.networkClientId
    : undefined;

  const existingTokens = useMemo(() => {
    const tokens =
      allTokens?.[selectedNetwork]?.[selectedAccount?.address ?? ''] ?? [];

    // When assets-unify-state is enabled, `allTokens` is derived from
    // AssetsController state. Hiding a token only flips
    // `assetPreferences[assetId].hidden = true`; the token stays in
    // `customAssets`, so it still appears in `allTokens`. Treat hidden tokens
    // as not-yet-imported so users can re-import them — `handleSubmit`
    // dispatches `importCustomAssetsBatch` with `isHidden: true`, which
    // unhides the asset rather than adding a duplicate.
    if (!assetsUnifyStateFeatureEnabled) {
      return tokens;
    }

    return tokens.filter((token) => {
      if (!token?.address) {
        return true;
      }
      const assetId = toAssetId(
        token.address as Hex,
        selectedNetwork as CaipChainId | Hex,
      );
      if (!assetId) {
        return true;
      }
      return !isAssetIdHiddenInPreferencesMap(assetPreferences, assetId);
    });
  }, [
    allTokens,
    assetPreferences,
    assetsUnifyStateFeatureEnabled,
    selectedAccount?.address,
    selectedNetwork,
  ]);

  const tokenListForSelectedNetwork =
    erc20TokensByChain?.[selectedNetwork]?.data;

  const [address, setAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [name, setName] = useState('');
  const [decimals, setDecimals] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [decimalsError, setDecimalsError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showSymbolAndDecimals, setShowSymbolAndDecimals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const infoGetter = useRef(tokenInfoGetter());
  const clickedSecurityLinkRef = useRef(false);
  // Tracks the in-flight `handleAddressChange` invocation so async results
  // from previous calls (stale address or stale network) can be discarded.
  const addressLookupRef = useRef(0);

  const trackViewed = useCallback(
    (viewState: string) => {
      trackEvent({
        category: MetaMetricsEventCategory.Wallet,
        event: MetaMetricsEventName.ImportCustomTokenViewed,
        properties: {
          [METRICS_PROPERTIES.viewState]: viewState,
        },
      });
    },
    [trackEvent],
  );

  useEffect(() => {
    trackViewed(CUSTOM_TOKEN_IMPORT_DEFAULT_VIEW_STATE);
  }, [trackViewed]);

  const resetValidation = useCallback(() => {
    setAddressError(null);
    setSymbolError(null);
    setDecimalsError(null);
    setWarning(null);
    setShowSymbolAndDecimals(false);
  }, []);

  const clearFormData = useCallback(() => {
    setAddress('');
    setSymbol('');
    setName('');
    setDecimals('');
    resetValidation();
  }, [resetValidation]);

  const handleAddressChange = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setAddress(trimmed);
      resetValidation();
      setSymbol('');
      setName('');
      setDecimals('');

      // Invalidate any in-flight lookup so its eventual result is ignored.
      addressLookupRef.current += 1;
      const lookupId = addressLookupRef.current;
      const isLatestLookup = () => addressLookupRef.current === lookupId;

      const addressIsEmpty = trimmed.length === 0 || trimmed === EMPTY_ADDRESS;
      const addressIsValid = isValidHexAddress(trimmed, {
        allowNonPrefixed: false,
      });
      const standardAddress = addHexPrefix(trimmed).toLowerCase();
      const isMainnetToken = Object.keys(STATIC_MAINNET_TOKEN_LIST).some(
        (key) => key.toLowerCase() === standardAddress,
      );

      // Probe the chain *before* applying validation branches so the NFT
      // branch wins over the mainnet-warning/personal-address/existing-token
      // branches, matching the order of the legacy `import-tokens-modal`
      // switch.
      let standard: string | undefined;
      let rpcTokenInfo;
      if (addressIsValid) {
        try {
          rpcTokenInfo = await getTokenStandardAndDetailsByChain(
            standardAddress,
            selectedAccount?.address,
            undefined,
            selectedNetwork,
          );
          standard = rpcTokenInfo?.standard;
        } catch {
          // ignore probe failures
        }
      }

      if (!isLatestLookup()) {
        return;
      }

      if (!addressIsValid && !addressIsEmpty) {
        setAddressError(t('invalidAddress'));
        return;
      }

      if (standard === ERC721 || standard === ERC1155) {
        setAddressError(t('nftAddressError', [t('importNFTPage')]));
        return;
      }

      if (isMainnetToken && selectedNetwork !== CHAIN_IDS.MAINNET) {
        setWarning(t('mainnetToken'));
        return;
      }

      const isOwnAccountAddress = internalAccounts.some(
        (account) => account.address?.toLowerCase() === standardAddress,
      );
      if (isOwnAccountAddress) {
        setAddressError(t('personalAddressDetected'));
        return;
      }

      if (checkExistingAddresses(trimmed, existingTokens)) {
        setAddressError(t('tokenAlreadyAdded'));
        return;
      }

      // Empty address (length 0 or `0x000…0`) falls through with no error and
      // skips the auto-fill, mirroring the legacy switch's default branch.
      if (addressIsEmpty) {
        return;
      }

      // Mirror `attemptToAutoFillTokenParams` from the legacy modal.
      try {
        const info = await infoGetter.current(
          standardAddress,
          tokenListForSelectedNetwork,
        );
        if (!isLatestLookup()) {
          return;
        }
        const {
          symbol: mergedSymbol,
          name: mergedName,
          decimals: mergedDecimals,
        } = mergeCustomTokenMetadataForImport(rpcTokenInfo, info);
        setSymbol(mergedSymbol);
        setName(mergedName);
        setDecimals(mergedDecimals);
        setShowSymbolAndDecimals(true);
        if (!mergedSymbol || mergedDecimals === '') {
          trackViewed(CUSTOM_TOKEN_IMPORT_LOOKUP_FAILED_VIEW_STATE);
        }
      } catch {
        if (!isLatestLookup()) {
          return;
        }
        setShowSymbolAndDecimals(true);
        trackViewed(CUSTOM_TOKEN_IMPORT_LOOKUP_FAILED_VIEW_STATE);
      }
    },
    [
      existingTokens,
      internalAccounts,
      resetValidation,
      selectedAccount?.address,
      selectedNetwork,
      t,
      trackViewed,
      tokenListForSelectedNetwork,
    ],
  );

  const handleSymbolChange = useCallback(
    (value: string) => {
      const next = value.trim();
      setSymbol(next);
      if (next.length === 0 || next.length >= 12) {
        setSymbolError(t('symbolBetweenZeroTwelve'));
      } else {
        setSymbolError(null);
      }
    },
    [t],
  );

  const handleDecimalsChange = useCallback(
    (value: string) => {
      if (value === '') {
        setDecimals('');
        setDecimalsError(t('decimalsMustZerotoTen'));
        return;
      }
      const next = Number(value);
      setDecimals(value);
      if (
        Number.isNaN(next) ||
        next < MIN_DECIMAL_VALUE ||
        next > MAX_DECIMAL_VALUE
      ) {
        setDecimalsError(t('decimalsMustZerotoTen'));
      } else {
        setDecimalsError(null);
      }
    },
    [t],
  );

  useEffect(() => {
    setSelectedNetwork(currentChainId);
  }, [currentChainId]);

  useEffect(() => {
    // Bump the lookup token so any address lookup started on the previous
    // network can't apply its result here.
    addressLookupRef.current += 1;
    clearFormData();
  }, [selectedNetwork, clearFormData]);

  const handleSelectNetwork = useCallback(
    (network: CustomTokenImportNetworkOption) => {
      const chainIdRef = network.chainId as CaipChainId | Hex;
      const networkChainId = isEvmChainId(chainIdRef)
        ? (formatChainIdToHex(chainIdRef) as string)
        : network.chainId;
      setSelectedNetwork(networkChainId);
      clearFormData();
    },
    [clearFormData],
  );

  const handleBack = useCallback(() => {
    navigate(TOKEN_MANAGEMENT_ROUTE);
  }, [navigate]);

  const handleClose = useCallback(() => {
    navigate(DEFAULT_ROUTE);
  }, [navigate]);

  const isValid =
    !addressError &&
    !symbolError &&
    !decimalsError &&
    !warning &&
    showSymbolAndDecimals &&
    address.length > 0 &&
    symbol.length > 0 &&
    decimals.length > 0;

  const parsedDecimals = Number(decimals);

  const handleSecurityLinkClick = useCallback(() => {
    clickedSecurityLinkRef.current = true;
  }, []);

  const trackSubmitAttempt = useCallback(
    (addedToken: 0 | 1) => {
      trackEvent({
        category: MetaMetricsEventCategory.Wallet,
        event: MetaMetricsEventName.ImportCustomTokenInteracted,
        sensitiveProperties: {
          [METRICS_PROPERTIES.addedToken]: addedToken,
          [METRICS_PROPERTIES.tokenSymbol]: symbol,
          [METRICS_PROPERTIES.tokenContractAddress]: address,
          [METRICS_PROPERTIES.chainId]: selectedNetwork,
          [METRICS_PROPERTIES.clickedSecurityLink]:
            clickedSecurityLinkRef.current,
          [METRICS_PROPERTIES.assetType]: AssetType.token,
          [METRICS_PROPERTIES.tokenStandard]: ERC20,
        },
      });
    },
    [address, selectedNetwork, symbol, trackEvent],
  );

  const handleSubmit = useCallback(async () => {
    if (Number.isNaN(parsedDecimals) || !isValid || isSubmitting) {
      return;
    }
    setIsSubmitting(true);
    try {
      await dispatch(
        addImportedTokens(
          [
            {
              address,
              symbol,
              decimals: parsedDecimals,
              isERC721: false,
            },
          ],
          networkClientId,
        ),
      );

      // When assets-unify-state is enabled, the manage-tokens list reads from
      // AssetsController (customAssets + assetsInfo) rather than
      // TokensController.allTokens.
      if (assetsUnifyStateFeatureEnabled && selectedAccount?.id) {
        const assetId = toAssetId(
          address as Hex,
          selectedNetwork as CaipChainId | Hex,
        );
        if (assetId) {
          await dispatch(
            importCustomAssetsBatch(
              selectedAccount.id,
              [
                {
                  assetId,
                  isHidden: isAssetIdHiddenInPreferencesMap(
                    assetPreferences,
                    assetId,
                  ),
                },
              ],
              {
                [assetId]: {
                  address,
                  symbol,
                  name: name || symbol,
                  decimals: parsedDecimals,
                  chainId: selectedNetwork,
                  unlisted: true,
                },
              },
            ),
          );
        }
      }

      trackSubmitAttempt(1);
      navigate(TOKEN_MANAGEMENT_ROUTE, {
        state: {
          tokenManagementToast: {
            type: 'customTokenAdded',
            symbol,
          },
        },
      });
    } catch (error) {
      trackSubmitAttempt(0);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, [
    address,
    assetPreferences,
    assetsUnifyStateFeatureEnabled,
    dispatch,
    isSubmitting,
    isValid,
    name,
    navigate,
    networkClientId,
    parsedDecimals,
    selectedAccount?.id,
    selectedNetwork,
    symbol,
    trackSubmitAttempt,
  ]);

  return (
    <Page data-testid="custom-token-import-page">
      <Header
        startAccessory={
          <ButtonIcon
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            size={ButtonIconSize.Md}
            onClick={handleBack}
            data-testid="custom-token-import-back-button"
          />
        }
        endAccessory={
          <ButtonIcon
            ariaLabel={t('close')}
            iconName={IconName.Close}
            size={ButtonIconSize.Md}
            onClick={handleClose}
            data-testid="custom-token-import-close-button"
          />
        }
        marginBottom={0}
      >
        {t('addCustomToken')}
      </Header>
      <CustomTokenImportForm
        networkName={networkName}
        selectedNetwork={selectedNetwork}
        networks={availableNetworks}
        address={address}
        addressError={addressError}
        symbol={symbol}
        symbolError={symbolError}
        decimals={decimals}
        decimalsError={decimalsError}
        warning={warning}
        showSymbolAndDecimals={showSymbolAndDecimals}
        isSubmitDisabled={!isValid || isSubmitting}
        isSubmitting={isSubmitting}
        onSelectNetwork={handleSelectNetwork}
        onAddressChange={handleAddressChange}
        onSymbolChange={handleSymbolChange}
        onDecimalsChange={handleDecimalsChange}
        onSecurityLinkClick={handleSecurityLinkClick}
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default CustomTokenImportPage;
