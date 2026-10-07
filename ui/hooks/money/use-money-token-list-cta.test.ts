import type { Hex } from '@metamask/utils';
import { EthAccountType } from '@metamask/keyring-api';
import mockState from '../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import type { TokenWithFiatAmount } from '../../components/app/assets/types';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from '../../pages/money/constants/money-events';
import { useMoneyAccountDeposit } from './useMoneyAccountDeposit';
import { useMoneyAccountInfo } from './useMoneyAccountInfo';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { createMoneyAnalyticsMock } from './useMoneyAnalytics.mock';
import { useMoneyVaultApy } from './useMoneyVaultApy';
import { useMoneyTokenListCta } from './use-money-token-list-cta';

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
  overrides: Partial<TokenWithFiatAmount> = {},
): TokenWithFiatAmount =>
  ({
    address: USDC_ADDRESS as Hex,
    chainId: '0x1',
    symbol: 'USDC',
    image: '',
    decimals: 6,
    title: 'USD Coin',
    secondary: null,
    balance: '100',
    tokenFiatAmount: 100,
    accountType: EthAccountType.Eoa,
    ...overrides,
  }) as TokenWithFiatAmount;

const buildState = (remoteFeatureFlags: Record<string, unknown> = {}) => ({
  ...mockState,
  metamask: {
    ...mockState.metamask,
    currentCurrency: 'usd',
    remoteFeatureFlags: {
      moneyEnableMoneyAccount: ENABLED_FLAG,
      earnMoneyTokenListItemCtaEnabled: ENABLED_FLAG,
      earnMoneyDepositCtaTokenAddresses: { '0x1': [USDC_ADDRESS] },
      ...remoteFeatureFlags,
    },
  },
});

const renderCta = (
  tokens: TokenWithFiatAmount[],
  remoteFeatureFlags?: Record<string, unknown>,
) =>
  renderHookWithProvider(
    () => useMoneyTokenListCta(tokens),
    buildState(remoteFeatureFlags),
  ).result.current;

describe('useMoneyTokenListCta', () => {
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
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercentFormatted: '6%',
    } as ReturnType<typeof useMoneyVaultApy>);
  });

  it('returns a labelled CTA when enabled', () => {
    const cta = renderCta([createToken()]);

    expect(cta?.label).toBe('Get 6% APY');
    expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: true });
  });

  it('returns undefined when the CTA flag is off', () => {
    const cta = renderCta([createToken()], {
      earnMoneyTokenListItemCtaEnabled: { ...ENABLED_FLAG, enabled: false },
    });

    expect(cta).toBeUndefined();
    expect(mockUseMoneyVaultApy).toHaveBeenCalledWith({ enabled: false });
  });

  it('returns undefined when the token address flag is empty', () => {
    expect(
      renderCta([createToken()], { earnMoneyDepositCtaTokenAddresses: {} }),
    ).toBeUndefined();
  });

  it('returns undefined when there is no Money account', () => {
    mockUseMoneyAccountInfo.mockReturnValue({
      isMoneyAccountFeatureEnabled: true,
      hasMoneyAccount: false,
      primaryMoneyAccount: undefined,
    });

    expect(renderCta([createToken()])).toBeUndefined();
  });

  it('returns undefined while the APY is unavailable', () => {
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercentFormatted: undefined,
    } as ReturnType<typeof useMoneyVaultApy>);

    expect(renderCta([createToken()])).toBeUndefined();
  });

  describe('shouldShow', () => {
    it('shows for an allowlisted token, ignoring address case', () => {
      const cta = renderCta([createToken()]);

      expect(
        cta?.shouldShow(
          createToken({ address: USDC_ADDRESS.toLowerCase() as Hex }),
        ),
      ).toBe(true);
    });

    it('does not show for a token on another chain', () => {
      const cta = renderCta([createToken()]);

      expect(cta?.shouldShow(createToken({ chainId: '0x89' }))).toBe(false);
    });

    it('does not show for a token that is not allowlisted', () => {
      const cta = renderCta([createToken()]);

      expect(
        cta?.shouldShow(
          createToken({
            address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
          }),
        ),
      ).toBe(false);
    });

    it('does not show for a non-EVM token', () => {
      const cta = renderCta([createToken()]);

      expect(
        cta?.shouldShow(
          createToken({
            chainId: 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp' as Hex,
            accountType: undefined,
          }),
        ),
      ).toBe(false);
    });

    it('does not show below the minimum deposit balance', () => {
      const cta = renderCta([createToken()], {
        earnMoneyDepositMinAssetBalance: 500,
      });

      expect(cta?.shouldShow(createToken({ tokenFiatAmount: 100 }))).toBe(
        false,
      );
    });

    it('does not show for a zero-balance token', () => {
      const cta = renderCta([createToken()]);

      expect(cta?.shouldShow(createToken({ tokenFiatAmount: 0 }))).toBe(false);
    });
  });

  describe('onClick', () => {
    it('tracks the click and deposits with the token pre-selected', () => {
      const otherToken = createToken({
        address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        symbol: 'USDT',
      });
      const token = createToken();
      const cta = renderCta([otherToken, token]);

      cta?.onClick(token);

      expect(mockUseMoneyAnalytics).toHaveBeenCalledWith({
        screenName: MoneyScreenName.WalletHome,
        componentName: MoneyComponentName.TokenListItemCta,
      });
      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith({
        buttonType: MoneyButtonType.Text,
        buttonIntent: MoneyButtonIntent.AddMoney,
        labelKey: 'moneyGetApy',
        labelSubstitutions: ['6%'],
        redirectTarget: MoneyScreenName.MoneyDeposit,
        tokenSymbol: 'USDC',
        tokenChainId: '0x1',
        tokenPositionInList: 2,
        tokensInList: 2,
        tokenHasBalance: true,
      });
      expect(mockInitiateDeposit).toHaveBeenCalledWith({
        preferredPaymentToken: { address: USDC_ADDRESS, chainId: '0x1' },
      });
    });
  });
});
