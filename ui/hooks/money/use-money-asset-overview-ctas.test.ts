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

const mockMessengerCall = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({ call: mockMessengerCall }),
}));

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

const USDC_TOKEN_KEY = `0x1:${USDC_ADDRESS.toLowerCase()}`;

const buildState = (
  remoteFeatureFlags: Record<string, unknown> = {},
  moneyEarnBannerDismissedTokenKeys: string[] = [],
) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    currentCurrency: 'usd',
    moneyEarnBannerDismissedTokenKeys,
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
  dismissedTokenKeys?: string[],
) =>
  renderHookWithProvider(
    () => useMoneyEarnBanner(token),
    buildState(remoteFeatureFlags, dismissedTokenKeys),
  ).result.current;

const renderBalanceCta = (
  token = createToken(),
  remoteFeatureFlags?: Record<string, unknown>,
  { enabled = true } = {},
) =>
  renderHookWithProvider(
    () => useMoneyAssetOverviewBalanceCta(token, { enabled }),
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

const mockDepositLoading = () =>
  mockUseMoneyAccountDeposit.mockReturnValue({
    initiateDeposit: mockInitiateDeposit,
    isLoading: true,
  } as unknown as ReturnType<typeof useMoneyAccountDeposit>);

const EXPECTED_DEPOSIT = {
  preferredPaymentToken: { address: USDC_ADDRESS as Hex, chainId: '0x1' },
};

describe('use-money-asset-overview-ctas', () => {
  const moneyAnalytics = createMoneyAnalyticsMock();

  beforeEach(() => {
    jest.clearAllMocks();
    mockMessengerCall.mockResolvedValue(undefined);
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

    it('ignores banner and CTA clicks while a deposit is starting', () => {
      mockDepositLoading();

      const banner = renderBanner();
      banner.onBannerClick();
      banner.onCtaClick();

      expect(moneyAnalytics.trackTokenSurfaceClicked).not.toHaveBeenCalled();
      expect(moneyAnalytics.trackTokenButtonClicked).not.toHaveBeenCalled();
      expect(mockInitiateDeposit).not.toHaveBeenCalled();
    });

    it('tracks and persists a dismissal without depositing', () => {
      renderBanner().onDismiss();

      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
        ...EXPECTED_TOKEN_PROPERTIES,
        buttonType: MoneyButtonType.Icon,
        buttonIntent: MoneyButtonIntent.Dismiss,
      });
      expect(mockMessengerCall).toHaveBeenCalledWith(
        'AppStateController:addMoneyEarnBannerDismissedTokenKey',
        USDC_TOKEN_KEY,
      );
      expect(mockInitiateDeposit).not.toHaveBeenCalled();
    });

    it('hides without fetching the APY once dismissed for the token', () => {
      const banner = renderBanner(createToken(), undefined, [USDC_TOKEN_KEY]);

      expect(banner.isVisible).toBe(false);
      expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
    });

    it('stays visible when another token was dismissed', () => {
      expect(
        renderBanner(createToken(), undefined, [
          `0xe708:${USDC_ADDRESS.toLowerCase()}`,
        ]).isVisible,
      ).toBe(true);
    });
  });

  describe('useMoneyEarnBanner for aTokens', () => {
    const A_TOKENS: [string, Hex, Hex][] = [
      [
        'Arbitrum aUSDC',
        '0xa4b1',
        '0x724dc807b04555b71ed48a6896b6F41593b8C637',
      ],
      ['Base aUSDC', '0x2105', '0x4e65fE4DbA92790696d040ac24Aa414708F5c0AB'],
      ['BNB aUSDC', '0x38', '0x00901a076785e0906d1028c7d6372d247bec7d61'],
      ['Ethereum aUSDC', '0x1', '0x98C23E9d8f34FEFb1B7BD6a91B7FF122F4e16F5c'],
      ['BNB aUSDT', '0x38', '0xa9251ca9DE909CB71783723713B21E4233fbf1B1'],
      ['Ethereum aUSDT', '0x1', '0x23878914EFE38d27C4D67Ab83ed1b93A74D4086a'],
      ['Ethereum aDAI', '0x1', '0x018008bfb33d285247A21d44E50697654f754e63'],
      ['Linea aUSDC', '0xe708', '0x374D7860c4f2f604De0191298dD393703Cce84f3'],
    ];

    const A_TOKEN_ALLOWLIST = A_TOKENS.reduce<Record<Hex, Hex[]>>(
      (allowlist, [, chainId, address]) => ({
        ...allowlist,
        [chainId]: [...(allowlist[chainId] ?? []), address],
      }),
      {},
    );

    const A_TOKEN_FLAGS = {
      earnMoneyDepositCtaTokenAddresses: A_TOKEN_ALLOWLIST,
    };

    const createAToken = (
      chainId: Hex,
      address: Hex,
      overrides: Partial<MoneyAssetOverviewToken> = {},
    ) => createToken({ chainId, address, symbol: 'AUSDC', ...overrides });

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(A_TOKENS)(
      'shows for %s with a balance',
      (_name: string, chainId: Hex, address: Hex) => {
        expect(
          renderBanner(createAToken(chainId, address), A_TOKEN_FLAGS).isVisible,
        ).toBe(true);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(A_TOKENS)(
      'hides for %s with a zero balance',
      (_name: string, chainId: Hex, address: Hex) => {
        expect(
          renderBanner(
            createAToken(chainId, address, {
              balance: '0',
              tokenFiatAmount: 0,
            }),
            A_TOKEN_FLAGS,
          ).isVisible,
        ).toBe(false);
      },
    );

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each(A_TOKENS)(
      'deposits with %s pre-selected',
      (_name: string, chainId: Hex, address: Hex) => {
        renderBanner(
          createAToken(chainId, address),
          A_TOKEN_FLAGS,
        ).onBannerClick();

        expect(mockInitiateDeposit).toHaveBeenCalledWith({
          preferredPaymentToken: { address, chainId },
        });
      },
    );

    it('hides for an aToken that is not allowlisted', () => {
      const [, chainId, address] = A_TOKENS[0];

      expect(
        renderBanner(createAToken(chainId, address), {
          earnMoneyDepositCtaTokenAddresses: { '0x1': [USDC_ADDRESS] },
        }).isVisible,
      ).toBe(false);
    });

    it('hides for an allowlisted aToken when geoblocked', () => {
      mockUseMoneyAccountInfo.mockReturnValue({
        isMoneyAccountFeatureEnabled: true,
        hasMoneyAccount: false,
        primaryMoneyAccount: undefined,
      });
      const [, chainId, address] = A_TOKENS[0];

      expect(
        renderBanner(createAToken(chainId, address), A_TOKEN_FLAGS).isVisible,
      ).toBe(false);
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

    // @ts-expect-error This is missing from the Mocha type definitions
    it.each([
      ['zero', 0, 0],
      ['negative', -0.003, -0.3],
    ])(
      'hides without tracking a view for a %s APY',
      (_name: string, apyDecimal: number, apyPercent: number) => {
        mockApy(apyDecimal, apyPercent);

        const balanceCta = renderBalanceCta();

        expect(balanceCta.display).toBeUndefined();
        expect(balanceCta.isLoading).toBe(false);
        expect(moneyAnalytics.trackComponentViewed).not.toHaveBeenCalled();
      },
    );

    it('hides without fetching the APY or tracking a view when not enabled', () => {
      const balanceCta = renderBalanceCta(createToken(), undefined, {
        enabled: false,
      });

      expect(balanceCta.display).toBeUndefined();
      expect(balanceCta.isLoading).toBe(false);
      expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
      expect(moneyAnalytics.trackComponentViewed).not.toHaveBeenCalled();
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

    it('ignores Start earning while a deposit is starting', () => {
      mockDepositLoading();

      renderBalanceCta().onStartEarning();

      expect(moneyAnalytics.trackTokenButtonClicked).not.toHaveBeenCalled();
      expect(mockInitiateDeposit).not.toHaveBeenCalled();
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
