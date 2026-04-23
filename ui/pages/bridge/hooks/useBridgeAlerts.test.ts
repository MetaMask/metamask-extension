import { renderHookWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useMultichainSelector } from '../../../hooks/useMultichainSelector';
import useRamps from '../../../hooks/ramps/useRamps/useRamps';
import {
  getActiveQuotePriceData,
  getBridgeQuotes,
  getBridgeUnavailableQuoteReason,
  getFormattedPriceImpactFiat,
  getFormattedPriceImpactPercentage,
  getToToken,
  getValidationErrors,
} from '../../../ducks/bridge/selectors';
import { BannerAlertSeverity } from '../../../components/component-library';
import { isQuoteExpiredOrInvalid } from '../utils/quote';
import { type BridgeAlert } from '../prepare/types';
import { useSecurityAlerts } from './useSecurityAlerts';
import { useAssetSecurityData } from './useAssetSecurityData';
import { useBridgeAlerts } from './useBridgeAlerts';

jest.mock('../../../hooks/useI18nContext');
jest.mock('../../../hooks/useMultichainSelector');
jest.mock('../../../hooks/ramps/useRamps/useRamps');
jest.mock('./useSecurityAlerts');
jest.mock('./useAssetSecurityData');
jest.mock('../utils/quote');

jest.mock('../../../ducks/bridge/selectors', () => ({
  ...jest.requireActual('../../../ducks/bridge/selectors'),
  getValidationErrors: jest.fn(),
  getBridgeUnavailableQuoteReason: jest.fn(),
  getToToken: jest.fn(),
  getActiveQuotePriceData: jest.fn(),
  getFormattedPriceImpactPercentage: jest.fn(),
  getFormattedPriceImpactFiat: jest.fn(),
  getBridgeQuotes: jest.fn(),
}));

const mockT = jest.fn((key: string, args?: string[]) =>
  args ? `${key}:${args.join(',')}` : key,
);

const MOCK_BRIDGE_QUOTE = {
  quote: { srcChainId: 1, destChainId: 10 },
};

const MOCK_SWAP_QUOTE = {
  quote: { srcChainId: 1, destChainId: 1 },
};

const MOCK_TO_TOKEN = {
  address: '0xabc',
  symbol: 'USDC',
  decimals: 6,
  chainId: 'eip155:10',
  assetId: 'eip155:10/erc20:0xabc',
};

const DEFAULT_VALIDATION_ERRORS = {
  isNoQuotesAvailable: false,
  isInsufficientGasForQuote: false,
  isInsufficientBalance: false,
  isStockMarketClosed: false,
  isQuoteExpired: false,
  isPriceImpactWarning: false,
  isPriceImpactError: false,
};

describe('useBridgeAlerts', () => {
  const mockOpenBuyCryptoInPdapp = jest.fn();

  const renderHook = () =>
    renderHookWithProvider(() => useBridgeAlerts(), { metamask: {} });

  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useI18nContext).mockReturnValue(mockT as never);
    jest.mocked(useMultichainSelector).mockReturnValue('ETH');
    jest.mocked(useRamps).mockReturnValue({
      openBuyCryptoInPdapp: mockOpenBuyCryptoInPdapp,
    } as never);
    jest
      .mocked(useSecurityAlerts)
      .mockReturnValue({ txAlert: null, securityWarnings: [] });
    jest.mocked(useAssetSecurityData).mockReturnValue({
      assetIsMalicious: false,
      assetIsSuspicious: false,
      assetMaliciousFeatures: [],
      assetSuspiciousFeatures: [],
      assetMaliciousLocalizedFeatures: [],
      assetSuspiciousLocalizedFeatures: [],
      assetIsVerified: false,
      assetHasSecurityData: false,
    });
    jest.mocked(isQuoteExpiredOrInvalid).mockReturnValue(false);

    jest
      .mocked(getValidationErrors)
      .mockReturnValue(DEFAULT_VALIDATION_ERRORS as never);
    jest
      .mocked(getBridgeUnavailableQuoteReason)
      .mockReturnValue(undefined as never);
    jest.mocked(getToToken).mockReturnValue(null as never);
    jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);
    jest.mocked(getFormattedPriceImpactPercentage).mockReturnValue('7.0%');
    jest.mocked(getFormattedPriceImpactFiat).mockReturnValue(null as never);
    jest.mocked(getBridgeQuotes).mockReturnValue({
      isLoading: false,
      activeQuote: null,
    } as never);
  });

  it('returns empty alert lists when no conditions are active', () => {
    const { result } = renderHook();

    expect(result.current.bannerAlerts).toHaveLength(0);
    expect(result.current.confirmationAlerts).toHaveLength(0);
    expect(result.current.alertsById).toStrictEqual({});
  });

  describe('market-closed alert', () => {
    it('adds market-closed to bannerAlerts and alertsById', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isStockMarketClosed: true,
      } as never);

      const { result } = renderHook();

      expect(result.current.bannerAlerts).toHaveLength(1);
      expect(result.current.bannerAlerts[0]).toStrictEqual(
        expect.objectContaining({
          id: 'market-closed',
          severity: 'danger',
          title: 'bridgeMarketClosedTitle',
          description: 'bridgeMarketClosedDescription',
          isConfirmationAlert: false,
          bannerAlertProps: { severity: BannerAlertSeverity.Danger },
        }),
      );
      expect(result.current.alertsById['market-closed']).toBeDefined();
      expect(result.current.confirmationAlerts).toHaveLength(0);
    });
  });

  describe('no-quotes alert', () => {
    it('adds no-quotes to bannerAlerts when isNoQuotesAvailable is true', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isNoQuotesAvailable: true,
      } as never);
      jest
        .mocked(getBridgeUnavailableQuoteReason)
        .mockReturnValue('bridgeNoRouteAvailable' as never);

      const { result } = renderHook();

      expect(result.current.bannerAlerts).toHaveLength(1);
      expect(result.current.bannerAlerts[0]).toStrictEqual(
        expect.objectContaining({
          id: 'no-quotes',
          severity: 'danger',
          description: 'bridgeNoRouteAvailable',
          isConfirmationAlert: false,
          bannerAlertProps: { severity: BannerAlertSeverity.Danger },
        }),
      );
      expect(result.current.alertsById['no-quotes']).toBeDefined();
      expect(result.current.confirmationAlerts).toHaveLength(0);
    });

    it('suppresses no-quotes when isStockMarketClosed is also true', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isNoQuotesAvailable: true,
        isStockMarketClosed: true,
      } as never);

      const { result } = renderHook();

      const ids = result.current.bannerAlerts.map((a: BridgeAlert) => a.id);
      expect(ids).not.toContain('no-quotes');
      expect(ids).toContain('market-closed');
    });

    it('suppresses no-quotes when isQuoteExpired is also true', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isNoQuotesAvailable: true,
        isQuoteExpired: true,
      } as never);

      const { result } = renderHook();

      const ids = result.current.bannerAlerts.map((a: BridgeAlert) => a.id);
      expect(ids).not.toContain('no-quotes');
    });
  });

  describe('tx-alert', () => {
    const mockTxAlert = {
      id: 'tx-alert' as const,
      title: 'Alert Title',
      description: 'Alert description',
      severity: 'danger' as const,
    };

    it('adds tx-alert to bannerAlerts when txAlert and activeQuote are both present', () => {
      jest
        .mocked(useSecurityAlerts)
        .mockReturnValue({ txAlert: mockTxAlert, securityWarnings: [] });
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('tx-alert');
      expect(result.current.alertsById['tx-alert']).toStrictEqual(
        expect.objectContaining({
          id: 'tx-alert',
          isDismissable: false,
          isConfirmationAlert: false,
          bannerAlertProps: { severity: BannerAlertSeverity.Danger },
        }),
      );
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('tx-alert');
    });

    it('does not add tx-alert when activeQuote is invalid (quote expired)', () => {
      jest
        .mocked(useSecurityAlerts)
        .mockReturnValue({ txAlert: mockTxAlert, securityWarnings: [] });
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(isQuoteExpiredOrInvalid).mockReturnValue(true);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('tx-alert');
    });

    it('does not add tx-alert when txAlert is null', () => {
      jest
        .mocked(useSecurityAlerts)
        .mockReturnValue({ txAlert: null, securityWarnings: [] });
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('tx-alert');
    });
  });

  describe('token-security alert', () => {
    beforeEach(() => {
      jest.mocked(getToToken).mockReturnValue(MOCK_TO_TOKEN as never);
    });

    it('adds a danger token-security alert when the asset is malicious', () => {
      jest.mocked(useAssetSecurityData).mockReturnValue({
        assetIsMalicious: true,
        assetIsSuspicious: false,
        assetMaliciousFeatures: [],
        assetSuspiciousFeatures: [],
        assetMaliciousLocalizedFeatures: [
          { title: 'Honeypot', description: null },
        ],
        assetSuspiciousLocalizedFeatures: [],
        assetIsVerified: false,
        assetHasSecurityData: true,
      });

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('token-security');
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('token-security');
      const alert = result.current.alertsById['token-security'];
      expect(alert).toStrictEqual(
        expect.objectContaining({
          id: 'token-security',
          severity: 'danger',
          title: `bridgeTokenIsMaliciousBanner:${MOCK_TO_TOKEN.symbol}`,
          description: '',
          modalProps: {
            title: 'bridgeMaliciousTokenTitle',
            description: `bridgeTokenIsMaliciousModalDescription:${MOCK_TO_TOKEN.symbol}`,
            infoList: [{ title: 'Honeypot', description: null }],
            alertModalErrorMessage: `bridgeTokenIsMaliciousModalDescription:${MOCK_TO_TOKEN.symbol}`,
          },
          isConfirmationAlert: true,
          openModalOnClick: true,
          bannerAlertProps: { severity: BannerAlertSeverity.Danger },
        }),
      );
    });

    it('adds a warning token-security alert when the asset is suspicious', () => {
      jest.mocked(useAssetSecurityData).mockReturnValue({
        assetIsMalicious: false,
        assetIsSuspicious: true,
        assetMaliciousFeatures: [],
        assetSuspiciousFeatures: [],
        assetMaliciousLocalizedFeatures: [],
        assetSuspiciousLocalizedFeatures: [
          { title: 'Airdrop', description: null },
        ],
        assetIsVerified: false,
        assetHasSecurityData: true,
      });

      const { result } = renderHook();

      const alert = result.current.alertsById['token-security'];
      expect(alert).toStrictEqual(
        expect.objectContaining({
          severity: 'warning',
          title: `bridgeTokenIsSuspiciousBanner:${MOCK_TO_TOKEN.symbol}`,
          description: '',
          modalProps: {
            title: 'bridgeSuspiciousTokenTitle',
            description: `bridgeTokenIsSuspiciousModalDescription:${MOCK_TO_TOKEN.symbol}`,
            infoList: [{ title: 'Airdrop', description: null }],
          },
          bannerAlertProps: { severity: BannerAlertSeverity.Warning },
        }),
      );
    });

    it('does not add token-security when toToken is null', () => {
      jest.mocked(getToToken).mockReturnValue(null as never);
      jest.mocked(useAssetSecurityData).mockReturnValue({
        assetIsMalicious: true,
        assetIsSuspicious: false,
        assetMaliciousFeatures: [],
        assetSuspiciousFeatures: [],
        assetMaliciousLocalizedFeatures: [],
        assetSuspiciousLocalizedFeatures: [],
        assetIsVerified: false,
        assetHasSecurityData: true,
      });

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('token-security');
    });

    it('does not add token-security when the asset is neither malicious nor suspicious', () => {
      jest.mocked(useAssetSecurityData).mockReturnValue({
        assetIsMalicious: false,
        assetIsSuspicious: false,
        assetMaliciousFeatures: [],
        assetSuspiciousFeatures: [],
        assetMaliciousLocalizedFeatures: [],
        assetSuspiciousLocalizedFeatures: [],
        assetIsVerified: true,
        assetHasSecurityData: true,
      });

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('token-security');
    });
  });

  describe('price-data-unavailable alert', () => {
    it('adds price-data-unavailable to both bannerAlerts and confirmationAlerts', () => {
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('price-data-unavailable');
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('price-data-unavailable');
      expect(result.current.alertsById['price-data-unavailable']).toStrictEqual(
        expect.objectContaining({
          id: 'price-data-unavailable',
          severity: 'danger',
          title: 'bridgeNoPriceInfoTitle',
          description: 'bridgePriceDataUnavailableError',
          isConfirmationAlert: true,
          bannerAlertProps: { severity: BannerAlertSeverity.Danger },
        }),
      );
    });

    it('does not add price-data-unavailable when price data is present', () => {
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue({
        priceImpact: 0.05,
      } as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('price-data-unavailable');
    });

    it('does not add price-data-unavailable when no quote is present', () => {
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: null,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('price-data-unavailable');
    });
  });

  describe('insufficient-gas alert', () => {
    beforeEach(() => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isInsufficientGasForQuote: true,
      } as never);
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
    });

    it('adds insufficient-gas to bannerAlerts with a buy action button', () => {
      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('insufficient-gas');
      const alert = result.current.alertsById['insufficient-gas'];
      expect(alert).toStrictEqual(
        expect.objectContaining({
          id: 'insufficient-gas',
          severity: 'danger',
          title: 'bridgeValidationInsufficientGasTitle:ETH',
          description: 'bridgeValidationInsufficientGasMessage:ETH',
          isConfirmationAlert: false,
        }),
      );
      expect(alert?.bannerAlertProps?.actionButtonLabel).toBe(
        'buyMoreAsset:ETH',
      );
      expect(alert?.bannerAlertProps?.actionButtonOnClick).toBeInstanceOf(
        Function,
      );
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('insufficient-gas');
    });

    it('uses the swap i18n key for same-chain quotes', () => {
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_SWAP_QUOTE,
      } as never);

      const { result } = renderHook();

      expect(result.current.alertsById['insufficient-gas']?.description).toBe(
        'swapValidationInsufficientGasMessage:ETH',
      );
    });

    it('calls openBuyCryptoInPdapp when the action button is clicked', () => {
      const { result } = renderHook();

      result.current.alertsById[
        'insufficient-gas'
      ]?.bannerAlertProps?.actionButtonOnClick?.();

      expect(mockOpenBuyCryptoInPdapp).toHaveBeenCalledTimes(1);
    });

    it('does not add insufficient-gas when isLoading is true', () => {
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: true,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('insufficient-gas');
    });

    it('does not add insufficient-gas when activeQuote is invalid', () => {
      jest.mocked(isQuoteExpiredOrInvalid).mockReturnValue(true);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('insufficient-gas');
    });

    it('does not add insufficient-gas when isInsufficientBalance is also true', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isInsufficientGasForQuote: true,
        isInsufficientBalance: true,
      } as never);

      const { result } = renderHook();

      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('insufficient-gas');
    });
  });

  describe('price-impact warning alert', () => {
    it('adds price-impact warning to alertsById only (no banner, no confirmation)', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isPriceImpactWarning: true,
      } as never);

      const { result } = renderHook();

      expect(result.current.alertsById['price-impact']).toStrictEqual(
        expect.objectContaining({
          id: 'price-impact',
          severity: 'warning',
          title: 'bridgePriceImpactHigh',
          description: 'bridgePriceImpactHighDescription:7.0%',
          isConfirmationAlert: false,
        }),
      );
      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('price-impact');
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('price-impact');
    });
  });

  describe('price-impact error alert', () => {
    it('adds price-impact error to confirmationAlerts but not bannerAlerts', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isPriceImpactError: true,
      } as never);
      jest.mocked(getFormattedPriceImpactPercentage).mockReturnValue('90.0%');

      const { result } = renderHook();

      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('price-impact');
      expect(
        result.current.bannerAlerts.map((a: BridgeAlert) => a.id),
      ).not.toContain('price-impact');
      expect(result.current.alertsById['price-impact']).toStrictEqual(
        expect.objectContaining({
          id: 'price-impact',
          severity: 'danger',
          title: 'bridgePriceImpactVeryHigh',
          description: 'bridgePriceImpactVeryHighDescription:90.0%',
          isConfirmationAlert: true,
        }),
      );
      expect(result.current.alertsById['price-impact']?.modalProps).toBe(
        undefined,
      );
    });

    it('includes the fiat loss message in modalProps.alertModalErrorMessage when available', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isPriceImpactError: true,
      } as never);
      jest
        .mocked(getFormattedPriceImpactFiat)
        .mockReturnValue('$12.34' as never);

      const { result } = renderHook();

      expect(
        result.current.alertsById['price-impact']?.modalProps
          ?.alertModalErrorMessage,
      ).toBe('bridgePriceImpactFiatAlert:$12.34');
    });

    it('error entry overwrites warning entry in alertsById when both are active', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isPriceImpactWarning: true,
        isPriceImpactError: true,
      } as never);

      const { result } = renderHook();

      expect(result.current.alertsById['price-impact']?.severity).toBe(
        'danger',
      );
    });
  });

  describe('alertsById', () => {
    it('keys every categorized alert by its id', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isStockMarketClosed: true,
      } as never);
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);

      const { result } = renderHook();

      expect(result.current.alertsById['market-closed']).toBeDefined();
      expect(result.current.alertsById['price-data-unavailable']).toBeDefined();
    });
  });

  describe('multiple simultaneous alerts', () => {
    it('shows market-closed and price-data-unavailable banners at the same time', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isStockMarketClosed: true,
      } as never);
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);

      const { result } = renderHook();

      const bannerIds = result.current.bannerAlerts.map(
        (a: BridgeAlert) => a.id,
      );
      expect(bannerIds).toContain('market-closed');
      expect(bannerIds).toContain('price-data-unavailable');
      expect(
        result.current.confirmationAlerts.map((a: BridgeAlert) => a.id),
      ).toContain('price-data-unavailable');
    });

    it('confirmationAlerts only contains alerts with isConfirmationAlert true', () => {
      jest.mocked(getValidationErrors).mockReturnValue({
        ...DEFAULT_VALIDATION_ERRORS,
        isStockMarketClosed: true,
        isPriceImpactError: true,
      } as never);
      jest.mocked(getBridgeQuotes).mockReturnValue({
        isLoading: false,
        activeQuote: MOCK_BRIDGE_QUOTE,
      } as never);
      jest.mocked(getActiveQuotePriceData).mockReturnValue(null as never);

      const { result } = renderHook();

      const confirmationIds = result.current.confirmationAlerts.map(
        (a: BridgeAlert) => a.id,
      );
      expect(confirmationIds).toContain('price-data-unavailable');
      expect(confirmationIds).toContain('price-impact');
      expect(confirmationIds).not.toContain('market-closed');
    });
  });
});
