import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxAlignItems,
  BoxBackgroundColor,
  BoxFlexDirection,
  Button,
  ButtonBase,
  ButtonBaseSize,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  FontWeight,
  IconName,
  Input,
  Text,
  TextAlign,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { type Hex } from '@metamask/utils';
import { isValidHexAddress } from '../../../shared/lib/hexstring-utils';
// TODO: Remove restricted import
// eslint-disable-next-line import-x/no-restricted-paths
import { addHexPrefix } from '../../../app/scripts/lib/util';

import { useI18nContext } from '../../hooks/useI18nContext';
import { Header } from '../../components/multichain/pages/page';
import { ScrollContainer } from '../../contexts/scroll-container';
import {
  addImportedTokens,
  getTokenStandardAndDetailsByChain,
  showModal,
} from '../../store/actions';
import {
  TOKEN_MANAGEMENT_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getCurrentChainId,
  getNetworkConfigurationsByChainId,
} from '../../../shared/lib/selectors/networks';
import { getSelectedEvmInternalAccount, getAllTokens } from '../../selectors';
import { checkExistingAddresses } from '../../helpers/utils/util';
import { tokenInfoGetter } from '../../helpers/utils/token-util';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import { CHAIN_IDS } from '../../../shared/constants/network';

const ERC1155 = 'ERC1155';
const ERC721 = 'ERC721';
const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';
const MIN_DECIMAL_VALUE = 0;
const MAX_DECIMAL_VALUE = 36;

type LabeledFieldProps = {
  id: string;
  label: string;
  error?: string | null;
  children: React.ReactNode;
};

/**
 * Wraps a DS `Input` with a label + optional error row to mirror the
 * affordances of the legacy `FormTextField`, which DS doesn't currently
 * provide a direct replacement for.
 * @param options0
 * @param options0.id
 * @param options0.label
 * @param options0.error
 * @param options0.children
 */
const LabeledField = ({ id, label, error, children }: LabeledFieldProps) => (
  <Box flexDirection={BoxFlexDirection.Column} gap={1}>
    <Text
      variant={TextVariant.BodySm}
      fontWeight={FontWeight.Medium}
      asChild
    >
      <label htmlFor={id}>{label}</label>
    </Text>
    {children}
    {error ? (
      <Text
        variant={TextVariant.BodySm}
        color={TextColor.ErrorDefault}
        role="alert"
      >
        {error}
      </Text>
    ) : null}
  </Box>
);

/**
 * Full-screen "Add a custom token" page.
 *
 * Companion screen to the Token Management page (introduced behind the same
 * `extensionUxTokenManagementFilter` feature flag). Replaces the legacy
 * "Custom token" tab inside the import-tokens modal with a dedicated route so
 * the flow can be deep-linked from the Manage tokens screen, breadcrumbed in
 * analytics, and laid out like a page rather than a modal.
 *
 * Validation mirrors the existing modal: address shape, ERC-721/1155 rejection,
 * mainnet-token-on-wrong-chain warning, duplicate detection, and on-chain
 * auto-fill of `symbol` + `decimals` for the entered contract. The submit
 * button stays disabled until those checks pass.
 *
 * The Network field opens the existing Network Manager modal — the same picker
 * the Manage tokens screen uses — so the two screens stay in sync rather than
 * introducing a second, page-local network selector. The chain that's
 * ultimately used for the import is the currently selected EVM chain at
 * submission time.
 */
export const CustomTokenImportPage = () => {
  const t = useI18nContext();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentChainId = useSelector(getCurrentChainId) as Hex;
  const networkConfigurations = useSelector(getNetworkConfigurationsByChainId);
  const selectedAccount = useSelector(getSelectedEvmInternalAccount);
  const allTokens = useSelector(getAllTokens) as Record<
    string,
    Record<string, { address: string }[]>
  >;

  const selectedNetwork = currentChainId;
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
  const [decimals, setDecimals] = useState<number | ''>('');
  const [addressError, setAddressError] = useState<string | null>(null);
  const [symbolError, setSymbolError] = useState<string | null>(null);
  const [decimalsError, setDecimalsError] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [showSymbolAndDecimals, setShowSymbolAndDecimals] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cached token info lookup so repeated edits of the same address don't
  // hammer the background script.
  const infoGetter = useRef(tokenInfoGetter());

  const resetValidation = useCallback(() => {
    setAddressError(null);
    setSymbolError(null);
    setDecimalsError(null);
    setWarning(null);
    setShowSymbolAndDecimals(false);
  }, []);

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

      // Warn (and refuse) when the address is a mainnet token but the user is
      // currently on another chain. Matches the existing modal behavior so we
      // don't accidentally import mainnet metadata against e.g. Polygon.
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

      // Identify NFTs before showing symbol/decimal fields — ERC-721/1155
      // tokens have to go through the NFT import flow instead.
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
        // Network/contract probe failures shouldn't block the user; they'll
        // still see decimal/symbol errors if auto-fill fails below.
      }

      if (standard === ERC721 || standard === ERC1155) {
        setAddressError(t('nftAddressError', [t('importNFTPage')]));
        return;
      }

      // Best-effort auto-fill of symbol/decimals from on-chain metadata. The
      // user can still edit either value before submitting.
      try {
        const info = await infoGetter.current(standardAddress, undefined);
        const nextSymbol = info?.symbol ?? '';
        const nextDecimals =
          typeof info?.decimals === 'number' ? info.decimals : '';
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
      setDecimals(Number.isNaN(next) ? '' : next);
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

  // If the user changes the active network from outside this page (e.g. via
  // the Network Manager modal we open), clear any prior form state so we don't
  // accidentally import a token that was validated against a different chain.
  useEffect(() => {
    setAddress('');
    setSymbol('');
    setDecimals('');
    resetValidation();
  }, [selectedNetwork, resetValidation]);

  const handleOpenNetworkPicker = useCallback(() => {
    dispatch(showModal({ name: 'NETWORK_MANAGER' }));
  }, [dispatch]);

  const handleClose = useCallback(() => {
    navigate(TOKEN_MANAGEMENT_ROUTE);
  }, [navigate]);

  const handleHardClose = useCallback(() => {
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
    typeof decimals === 'number';

  const handleSubmit = useCallback(async () => {
    if (!isValid || isSubmitting || typeof decimals !== 'number') {
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
              decimals,
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
    decimals,
    dispatch,
    isSubmitting,
    isValid,
    navigate,
    networkClientId,
    symbol,
  ]);

  const startAccessory = (
    <ButtonIcon
      iconName={IconName.ArrowLeft}
      ariaLabel={t('back')}
      size={ButtonIconSize.Sm}
      onClick={handleClose}
      data-testid="custom-token-import-back-button"
    />
  );

  const endAccessory = (
    <ButtonIcon
      iconName={IconName.Close}
      ariaLabel={t('close')}
      size={ButtonIconSize.Sm}
      onClick={handleHardClose}
      data-testid="custom-token-import-close-button"
    />
  );

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      backgroundColor={BoxBackgroundColor.BackgroundDefault}
      className="w-full h-full min-h-0"
      data-testid="custom-token-import-page"
    >
      <Header startAccessory={startAccessory} endAccessory={endAccessory}>
        {t('addCustomToken')}
      </Header>

      <ScrollContainer
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          width: '100%',
        }}
      >
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={4}
          paddingHorizontal={4}
          paddingTop={3}
          paddingBottom={4}
        >
          <BannerAlert
            severity={BannerAlertSeverity.Warning}
            data-testid="custom-token-import-warning"
          >
            <Text variant={TextVariant.BodySm}>{t('importTokenWarning')}</Text>
          </BannerAlert>

          <Box flexDirection={BoxFlexDirection.Column} gap={1}>
            <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
              {t('network')}
            </Text>
            <ButtonBase
              isFullWidth
              data-testid="custom-token-import-network-picker"
              size={ButtonBaseSize.Lg}
              endIconName={IconName.ArrowDown}
              className="bg-default text-default border border-muted justify-between"
              textProps={{ textAlign: TextAlign.Left, ellipsis: true }}
              onClick={handleOpenNetworkPicker}
            >
              {networkName}
            </ButtonBase>
          </Box>

          <LabeledField
            id="custom-token-import-address"
            label={t('tokenContractAddress')}
            error={addressError}
          >
            <Input
              id="custom-token-import-address"
              data-testid="custom-token-import-address-input"
              placeholder={t('enterTokenAddress')}
              value={address}
              aria-invalid={Boolean(addressError)}
              className="h-12 px-4"
              onChange={(event) => handleAddressChange(event.target.value)}
            />
          </LabeledField>

          {warning ? (
            <BannerAlert
              severity={BannerAlertSeverity.Warning}
              data-testid="custom-token-import-mainnet-warning"
            >
              <Text variant={TextVariant.BodySm}>{warning}</Text>
            </BannerAlert>
          ) : null}

          {showSymbolAndDecimals ? (
            <>
              <LabeledField
                id="custom-token-import-symbol"
                label={t('tokenSymbol')}
                error={symbolError}
              >
                <Input
                  id="custom-token-import-symbol"
                  data-testid="custom-token-import-symbol-input"
                  value={symbol}
                  aria-invalid={Boolean(symbolError)}
                  className="h-12 px-4"
                  onChange={(event) => handleSymbolChange(event.target.value)}
                />
              </LabeledField>
              <LabeledField
                id="custom-token-import-decimal"
                label={t('tokenDecimal')}
                error={decimalsError}
              >
                <Input
                  id="custom-token-import-decimal"
                  data-testid="custom-token-import-decimal-input"
                  type="number"
                  value={decimals === '' ? '' : String(decimals)}
                  aria-invalid={Boolean(decimalsError)}
                  className="h-12 px-4"
                  onChange={(event) => handleDecimalsChange(event.target.value)}
                />
              </LabeledField>
            </>
          ) : null}
        </Box>
      </ScrollContainer>

      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        paddingHorizontal={4}
        paddingTop={3}
        paddingBottom={3}
        className="sticky bottom-0 z-10"
      >
        <Button
          isFullWidth
          size={ButtonSize.Lg}
          data-testid="custom-token-import-submit-button"
          isDisabled={!isValid || isSubmitting}
          isLoading={isSubmitting}
          onClick={handleSubmit}
        >
          {t('addToken')}
        </Button>
      </Box>
    </Box>
  );
};

export default CustomTokenImportPage;
