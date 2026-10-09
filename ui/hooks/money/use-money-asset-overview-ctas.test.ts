import type { Hex } from '@metamask/utils';
import { EthAccountType } from '@metamask/keyring-api';
import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../pages/money/constants/money-events';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { createMoneyAnalyticsMock } from './useMoneyAnalytics.mock';
import { useMoneyVaultApy } from './useMoneyVaultApy';
import {
  useMoneyAssetOverviewBalanceCta,
  useMoneyEarnBanner,
  type MoneyAssetOverviewToken,
} from './use-money-asset-overview-ctas';

jest.mock('./useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  useMoneyAccountInfo: jest.fn(),
}));

jest.mock('./useMoneyAnalytics', () => ({
  useMoneyAnalytics: jest.fn(),
}));

jest.mock('./useMoneyVaultApy', () => ({
  useMoneyVaultApy: jest.fn(),
}));

const mockUseMoneyAccountDeposit = jest.mocked(useMoneyAccountDeposit);
const mockUseMoneyAccountInfo = jest.mocked(useMoneyAccountInfo);
const mockUseMoneyAnalytics = jest.mocked(useMoneyAnalytics);
const mockUseMoneyVaultApy = jest.mocked(useMoneyVaultApy);
const mockInitiateDeposit = jest.fn();

const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
const ENABLED_FLAG = { enabled: true, minimumVersion: '0.0.1' };

const createToken = (
  overrides: Partial<MoneyAssetOverviewToken> = {},
): MoneyAssetOverviewToken => ({
  address: USDC_ADDRESS,
  chainId: '0x1',
  symbol: 'USDC',
  balance: '1000',
  tokenFiatAmount: 1000,
  isNative: false,
  accountType: EthAccountType.Eoa,
  ...overrides,
});

const buildState = (remoteFeatureFlags: Record<string, unknown> = {}) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    currentCurrency: 'usd',
    remoteFeatureFlags: {
      moneyEnableMoneyAccount: ENABLED_FLAG,
      earnMoneyEarnBannerEnabled: ENABLED_FLAG,
      earnMoneyAssetOverviewBalanceCtaEnabled: ENABLED_FLAG,
      earnMoneyDepositCtaTokenAddresses: { '0x1': [USDC_ADDRESS] },
      ...remoteFeatureFlags,
    },
  },
});

const renderBanner = (
  token = createToken(),
  remoteFeatureFlags?: Record<string, unknown>,
) =>
  renderHookWithProvider(
    () => useMoneyEarnBanner(token),
    buildState(remoteFeatureFlags),
  ).result.current;

const renderBalanceCta = (
  token = createToken(),
  remoteFeatureFlags?: Record<string, unknown>,
) =>
  renderHookWithProvider(
    () => useMoneyAssetOverviewBalanceCta(token),
    buildState(remoteFeatureFlags),
  ).result.current;

const mockApy = (
  apyDecimal?: number,
  apyPercent?: number,
  { isLoading = false } = {},
) =>
  mockUseMoneyVaultApy.mockReturnValue({
    vaultApyQuery: { isLoading },
    apyDecimal,
    apyPercent,
    apyPercentFormatted:
      apyPercent === undefined ? undefined : `${apyPercent}%`,
  } as ReturnType<typeof useMoneyVaultApy>);

const EXPECTED_TOKEN_PROPERTIES = {
  tokenSymbol: 'USDC',
  tokenChainId: '0x1',
  tokenPositionInList: 1,
  tokensInList: 1,
  tokenHasBalance: true,
};

const EXPECTED_DEPOSIT = {
  preferredPaymentToken: { address: USDC_ADDRESS as Hex, chainId: '0x1' },
};

describe('use-money-asset-overview-ctas', () => {
  const moneyAnalytics = createMoneyAnalyticsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMoneyAnalytics.mockReturnValue(moneyAnalytics);
    mockUseMoneyAccountDeposit.mockReturnValue({
      initiateDeposit: mockInitiateDeposit,
      isLoading: false,
    } as unknown as ReturnType<typeof useMoneyAccountDeposit>);
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: true,
      primaryMoneyAccount: { address: '0x1234' },
    });
    mockApy(0.06, 6);
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  describe.each([
    ['useMoneyEarnBanner', 'earnMoneyEarnBannerEnabled', renderBanner],
    [
      'useMoneyAssetOverviewBalanceCta',
      'earnMoneyAssetOverviewBalanceCtaEnabled',
      renderBalanceCta,
    ],
  ])(
    '%s visibility',
    (
      _name: string,
      flagName: string,
      renderCta: (
        token?: MoneyAssetOverviewToken,
        flags?: Record<string, unknown>,
      ) => { isVisible?: boolean; display?: unknown },
    ) => {
      const isShown = (result: { isVisible?: boolean; display?: unknown }) =>
        result.isVisible ?? result.display !== undefined;

      it('shows for an allowlisted token with a balance', () => {
        expect(isShown(renderCta())).toBe(true);
        expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: true });
      });

      it('hides when its flag is off', () => {
        expect(
          isShown(
            renderCta(createToken(), {
              [flagName]: { ...ENABLED_FLAG, enabled: false },
            }),
          ),
        ).toBe(false);
        expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
      });

      it('hides when the Money Account flag is off', () => {
        expect(
          isShown(
            renderCta(createToken(), {
              moneyEnableMoneyAccount: { ...ENABLED_FLAG, enabled: false },
            }),
          ),
        ).toBe(false);
      });

      it('hides when the user has no Money account, e.g. when geoblocked', () => {
        mockUseMoneyAccountInfo.mockReturnValue({
          isMoneyAccountFeatureEnabled: true,
          hasMoneyAccount: false,
          primaryMoneyAccount: undefined,
        });

        expect(isShown(renderCta())).toBe(false);
      });

      it('hides for a zero balance', () => {
        expect(
          isShown(renderCta(createToken({ balance: '0', tokenFiatAmount: 0 }))),
        ).toBe(false);
      });

      it('hides below the minimum deposit balance', () => {
        expect(
          isShown(
            renderCta(createToken(), { earnMoneyDepositMinAssetBalance: 5000 }),
          ),
        ).toBe(false);
      });

      it('hides for a token that is not allowlisted', () => {
        expect(
          isShown(
            renderCta(
              createToken({
                address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
                symbol: 'USDT',
              }),
            ),
          ),
        ).toBe(false);
      });

      it('hides for the allowlisted address on another chain', () => {
        expect(isShown(renderCta(createToken({ chainId: '0x89' })))).toBe(
          false,
        );
      });

      it('hides for a native asset', () => {
        expect(isShown(renderCta(createToken({ isNative: true })))).toBe(false);
      });
    },
  );

  describe('useMoneyEarnBanner', () => {
    it('uses the asset detail banner analytics location', () => {
      renderBanner();

      expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
        screenName: MoneyScreenName.AssetDetail,
        componentName: MoneyComponentName.EarnBanner,
      });
    });

    it('returns the live APY', () => {
      mockApy(0.074, 7.4);

      expect(renderBanner().apyPercentFormatted).toBe('7.4%');
    });

    it('stays visible without an APY so the fallback title can show', () => {
      mockApy(undefined);

      const banner = renderBanner();

      expect(banner.isVisible).toBe(true);
      expect(banner.apyPercentFormatted).toBeUndefined();
    });

    it('omits a zero APY', () => {
      mockApy(0, 0);

      expect(renderBanner().apyPercentFormatted).toBeUndefined();
    });

    it('tracks a banner click and deposits with the token pre-selected', () => {
      renderBanner().onBannerClick();

      expect(moneyAnalytics.trackTokenSurfaceClicked).toHaveBeenCalledWith({
        ...EXPECTED_TOKEN_PROPERTIES,
        redirectTarget: MoneyScreenName.MoneyDeposit,
      });
      expect(mockInitiateDeposit).toHaveBeenCalledWith(EXPECTED_DEPOSIT);
    });

    it('tracks a CTA click and deposits with the token pre-selected', () => {
      renderBanner().onCtaClick();

      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
        ...EXPECTED_TOKEN_PROPERTIES,
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyEarnBannerCta',
        labelSubstitutions: ['USDC'],
        redirectTarget: MoneyScreenName.MoneyDeposit,
      });
      expect(mockInitiateDeposit).toHaveBeenCalledWith(EXPECTED_DEPOSIT);
    });

    it('tracks a dismissal without depositing', () => {
      renderBanner().onDismiss();

      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
        ...EXPECTED_TOKEN_PROPERTIES,
        buttonType: MoneyButtonType.Icon,
        buttonIntent: MoneyButtonIntent.Dismiss,
      });
      expect(mockInitiateDeposit).not.toHaveBeenCalled();
    });
  });

  describe('useMoneyAssetOverviewBalanceCta', () => {
    it('returns the APY and one year of projected earnings', () => {
      mockApy(0.062, 6.2);

      expect(renderBalanceCta().display).toStrictEqual({
        apyPercent: 6.2,
        apyPercentFormatted: '6.2%',
        projectedEarningsFormatted: '+$62.00',
      });
    });

    it('hides without loading once the APY request has settled empty', () => {
      mockApy(undefined);

      const balanceCta = renderBalanceCta();

      expect(balanceCta.display).toBeUndefined();
      expect(balanceCta.isLoading).toBe(false);
    });

    it('is loading while the APY request is in flight', () => {
      mockApy(undefined, undefined, { isLoading: true });

      const balanceCta = renderBalanceCta();

      expect(balanceCta.display).toBeUndefined();
      expect(balanceCta.isLoading).toBe(true);
    });

    it('shows the fallback APY instead of loading while the request is in flight', () => {
      mockApy(0.05, 5, { isLoading: true });

      const balanceCta = renderBalanceCta();

      expect(balanceCta.display).toBeDefined();
      expect(balanceCta.isLoading).toBe(false);
    });

    it('is not loading for an ineligible token', () => {
      mockApy(undefined, undefined, { isLoading: true });

      expect(
        renderBalanceCta(createToken({ tokenFiatAmount: 0 })).isLoading,
      ).toBe(false);
    });

    it('does not track a view while loading', () => {
      mockApy(undefined, undefined, { isLoading: true });

      renderBalanceCta();

      expect(moneyAnalytics.trackComponentViewed).not.toHaveBeenCalled();
    });

    it('tracks the component view when shown', () => {
      renderBalanceCta();

      expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
        screenName: MoneyScreenName.AssetDetail,
        componentName: MoneyComponentName.AssetOverviewBalanceCta,
      });
      expect(moneyAnalytics.trackComponentViewed).toHaveBeenCalledTimes(1);
    });

    it('does not track a view when hidden', () => {
      renderBalanceCta(createToken({ tokenFiatAmount: 0 }));

      expect(moneyAnalytics.trackComponentViewed).not.toHaveBeenCalled();
    });

    it('tracks Start earning and deposits with the token pre-selected', () => {
      renderBalanceCta().onStartEarning();

      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
        ...EXPECTED_TOKEN_PROPERTIES,
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyStartEarning',
        redirectTarget: MoneyScreenName.MoneyDeposit,
      });
      expect(mockInitiateDeposit).toHaveBeenCalledWith(EXPECTED_DEPOSIT);
    });

    it('tracks the projected earnings tooltip', () => {
      renderBalanceCta().onProjectionTooltipOpen();

      expect(moneyAnalytics.trackTooltipClicked).toHaveBeenCalledWith({
        tooltipName: MoneyTooltipName.EarnOnYourCrypto,
        tooltipType: MoneyTooltipType.Info,
      });
    });
  });
});
