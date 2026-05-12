import React, {
  useCallback,
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
import { ERC721, ERC1155 } from '@metamask/controller-utils';
import { type Hex } from '@metamask/utils';
import { isValidHexAddress } from '../../../shared/lib/hexstring-utils';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { addHexPrefix } from '../../../app/scripts/lib/util';

import { useI18nContext } from '../../hooks/useI18nContext';
import { Header, Page } from '../../components/multichain/pages/page';
import {
  addImportedTokens,
  getTokenStandardAndDetailsByChain,
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
import { getSelectedEvmInternalAccount, getAllTokens } from '../../selectors';
import { checkExistingAddresses } from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { isEvmChainId } from '../../../shared/lib/asset-utils';
import { type CustomTokenImportNetworkOption } from './custom-token-import-network-selector';
import { CustomTokenImportForm } from './custom-token-import-form';

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MIN_DECIMAL_VALUE = 0;
const MAX_DECIMAL_VALUE = 36;

/**
 * Full-screen "Add a custom token" page.
 */
export const CustomTokenImportPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentChainId = useSelector(getCurrentChainId) as Hex;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const allNetworkConfigurations = useSelector(
    getAllNetworkConfigurationsByCaipChainId,
  );
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const allTokens = useSelector(getAllTokens) as Record<
    string,
    Record<string, { address: string }[]>
  >;

  const [selectedNetwork, setSelectedNetwork] = useState<Hex>(currentChainId);

  const evmNetworks = useMemo<CustomTokenImportNetworkOption[]>(
    () =>
      Object.values(allNetworkConfigurations)
        .filter((network) => isEvmChainId(network.chainId as Hex))
        .map(({ chainId, name }) => ({
          chainId,
          name,
        })),
    [allNetworkConfigurations],
  );

  const networkName =
    networkConfigurations?.[selectedNetwork]?.name ?? t('currentNetwork');
  const networkClientId =
    networkConfigurations?.[selectedNetwork]?.rpcEndpoints?.[
      networkConfigurations?.[selectedNetwork]?.defaultRpcEndpointIndex ?? 0
    ]?.networkClientId;

  const existingTokens = useMemo(
    () => allTokens?.[selectedNetwork]?.[selectedAccount?.address ?? ''] ?? [],
    [allTokens, selectedNetwork, selectedAccount?.address],
  );

  const [address, setAddress] = useState('');
  const [symbol, setSymbol] = useState('');
  const [decimals, setDecimals] = useState('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [decimalsError, setDecimalsError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showSymbolAndDecimals, setShowSymbolAndDecimals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const infoGetter = useRef(tokenInfoGetter());

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
    setDecimals('');
    resetValidation();
  }, [resetValidation]);

  const handleAddressChange = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setAddress(trimmed);
      resetValidation();

      if (!trimmed) {
        setSymbol('');
        setDecimals('');
        return;
      }

      const addressIsValid = isValidHexAddress(trimmed, {
        allowNonPrefixed: false,
      });
      if (!addressIsValid || trimmed === EMPTY_ADDRESS) {
        setAddressError(t('invalidAddress'));
        return;
      }

      const standardAddress = addHexPrefix(trimmed).toLowerCase();

      const isMainnetToken = Object.keys(STATIC_MAINNET_TOKEN_LIST).some(
        (key) => key.toLowerCase() === standardAddress,
      );
      if (isMainnetToken && selectedNetwork !== CHAIN_IDS.MAINNET) {
        setWarning(t('mainnetToken'));
        return;
      }

      if (checkExistingAddresses(trimmed, existingTokens)) {
        setAddressError(t('tokenAlreadyAdded'));
        return;
      }

      let standard: string | undefined;
      try {
        const result = await getTokenStandardAndDetailsByChain(
          standardAddress,
          selectedAccount?.address,
          undefined,
          selectedNetwork,
        );
        standard = result?.standard;
      } catch {
        // Probe failures shouldn't block the user; symbol/decimal auto-fill
        // below will surface its own errors if it also fails.
      }

      if (standard === ERC721 || standard === ERC1155) {
        setAddressError(t('nftAddressError', [t('importNFTPage')]));
        return;
      }

      try {
        const info = await infoGetter.current(standardAddress, undefined);
        const nextSymbol = info?.symbol ?? '';
        const nextDecimals =
          typeof info?.decimals === 'number' ? String(info.decimals) : '';
        setSymbol(nextSymbol);
        setDecimals(nextDecimals);
        setShowSymbolAndDecimals(true);
      } catch {
        setShowSymbolAndDecimals(true);
      }
    },
    [
      existingTokens,
      resetValidation,
      selectedAccount?.address,
      selectedNetwork,
      t,
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
    clearFormData();
  }, [selectedNetwork, clearFormData]);

  const handleSelectNetwork = useCallback(
    (network: CustomTokenImportNetworkOption) => {
      const networkChainId = formatChainIdToHex(network.chainId) as Hex;
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
      navigate(TOKEN_MANAGEMENT_ROUTE);
    } finally {
      setIsSubmitting(false);
    }
  }, [
    address,
    dispatch,
    isSubmitting,
    isValid,
    navigate,
    networkClientId,
    parsedDecimals,
    symbol,
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
        networks={evmNetworks}
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
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default CustomTokenImportPage;
