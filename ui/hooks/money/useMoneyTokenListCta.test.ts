import type { Hex } from '@metamask/utils';
import { EthAccountType } from '@metamask/keyring-api';
import { useQueryClient } from '@tanstack/react-query';
import { waitFor } from '@testing-library/react';
// eslint-disable-next-line import-x/no-restricted-paths
import { MoneyAccountAvailabilityService } from '../../../app/scripts/lib/money/money-account-availability';
// eslint-disable-next-line import-x/no-restricted-paths
import type { MoneyAccountAvailabilityMessenger } from '../../../app/scripts/lib/money/money-account-availability';
import { CHAIN_IDS } from '../../../shared/constants/chain-ids';
import { MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME } from '../../../shared/lib/money/vault-config';
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
import {
  MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY,
  useMoneyAccountInfo,
} from './useMoneyAccountInfo';
import { useMoneyAnalytics } from './useMoneyAnalytics';
import { createMoneyAnalyticsMock } from './useMoneyAnalytics.mock';
import { useMoneyVaultApy } from './useMoneyVaultApy';
import { useMoneyTokenListCta } from './useMoneyTokenListCta';

jest.mock('../../../app/scripts/lib/money/get-money-account-address', () => ({
  deriveMoneyAccountAddress: jest.fn().mockResolvedValue('0x1234'),
}));

const mockMessengerCall = jest.fn();

jest.mock('../useMessenger', () => ({
  useMessenger: () => ({ call: mockMessengerCall }),
}));

jest.mock('./useMoneyAccountDeposit', () => ({
  useMoneyAccountDeposit: jest.fn(),
}));

jest.mock('./useMoneyAccountInfo', () => ({
  ...jest.requireActual('./useMoneyAccountInfo'),
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
const VAULT_CONFIG = {
  chainId: CHAIN_IDS.MONAD,
  boringVault: '0xb4563bcD3B7764CCBf497f515585f70B6C3EA5Ae',
  tellerAddress: '0x2D49EA58A4C70b62c8B56DE971310d9e999c8117',
  accountantAddress: '0x7382c5b8B51B8C4f127B3123C1039581BAA5A06B',
  lensAddress: '0xA816ECd922de94c6879AD23B9A884dB257F20947',
  underlyingToken: '0xacA92E438df0B2401fF60dA7E4337B687a2435DA',
};
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
      apyPercent: 6,
      apyPercentFormatted: '6%',
    } as ReturnType<typeof useMoneyVaultApy>);
  });

  it('returns a labelled CTA when enabled', () => {
    const cta = renderCta([createToken()]);

    expect(cta?.label).toBe('Get 6% APY');
    expect(cta?.isLoading).toBe(false);
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
      apyPercent: undefined,
      apyPercentFormatted: undefined,
    } as ReturnType<typeof useMoneyVaultApy>);

    expect(renderCta([createToken()])).toBeUndefined();
  });

  it('returns undefined when the APY rounds to zero', () => {
    mockUseMoneyVaultApy.mockReturnValue({
      apyPercent: 0,
      apyPercentFormatted: '0%',
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
    it('does nothing while a deposit is being set up', () => {
      mockUseMoneyAccountDeposit.mockReturnValue({
        initiateDeposit: mockInitiateDeposit,
        isLoading: true,
      } as unknown as ReturnType<typeof useMoneyAccountDeposit>);
      const token = createToken();
      const cta = renderCta([token]);

      cta?.onClick(token);

      expect(cta?.isLoading).toBe(true);
      expect(moneyAnalytics.trackTokenButtonClicked).not.toHaveBeenCalled();
      expect(mockInitiateDeposit).not.toHaveBeenCalled();
    });

    it('reports token_has_balance from the token balance, not its fiat value', () => {
      const token = createToken({ balance: '0', tokenFiatAmount: 100 });
      const cta = renderCta([token]);

      cta?.onClick(token);

      expect(moneyAnalytics.trackTokenButtonClicked).toHaveBeenCalledWith(
        expect.objectContaining({ tokenHasBalance: false }),
      );
    });

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

  describe('geo-blocking', () => {
    const createAvailabilityService = (location: string) => {
      const messenger = {
        call: (action: string) => {
          switch (action) {
            case 'RemoteFeatureFlagController:getState':
              return {
                remoteFeatureFlags: {
                  [MONEY_ACCOUNT_VAULT_CONFIG_FLAG_NAME]: VAULT_CONFIG,
                },
              };
            case 'GeolocationController:getGeolocation':
              return location;
            case 'NetworkController:getState':
              return {
                networkConfigurationsByChainId: { [CHAIN_IDS.MONAD]: {} },
              };
            default:
              throw new Error(`Unexpected action: ${action}`);
          }
        },
        subscribe: jest.fn(),
        registerMethodActionHandlers: jest.fn(),
      } as unknown as MoneyAccountAvailabilityMessenger;

      return new MoneyAccountAvailabilityService({ messenger });
    };

    const renderCtaInRegion = async (location: string) => {
      const service = createAvailabilityService(location);
      mockMessengerCall.mockImplementation((action: string) => {
        if (action !== 'MoneyAccountAvailabilityService:getAvailability') {
          throw new Error(`Unexpected action: ${action}`);
        }
        return service.getAvailability();
      });

      const state = buildState();
      const { result } = renderHookWithProvider(
        () => ({
          cta: useMoneyTokenListCta([createToken()]),
          availability: useQueryClient().getQueryData(
            MONEY_ACCOUNT_AVAILABILITY_QUERY_KEY,
          ),
        }),
        {
          ...state,
          metamask: { ...state.metamask, useExternalServices: true },
        },
      );

      await waitFor(() => expect(result.current.availability).toBeDefined());

      return result.current;
    };

    beforeEach(() => {
      mockUseMoneyAccountInfo.mockImplementation(
        jest.requireActual('./useMoneyAccountInfo').useMoneyAccountInfo,
      );
    });

    it('shows the CTA to users in an allowed region', async () => {
      const { availability, cta } = await renderCtaInRegion('US');

      expect(availability).toStrictEqual({
        isAvailable: true,
        address: '0x1234',
      });
      expect(cta?.label).toBe('Get 6% APY');
    });

    it.each(['GB', 'GB-ENG', 'UNKNOWN'])(
      'never shows the CTA to users in %s',
      async (location) => {
        const { availability, cta } = await renderCtaInRegion(location);

        expect(availability).toStrictEqual({ isAvailable: false });
        expect(cta).toBeUndefined();
        expect(
          mockUseMoneyVaultApy.mock.calls.every(
            ([options]) => options?.enabled === false,
          ),
        ).toBe(true);
      },
    );
  });
});
