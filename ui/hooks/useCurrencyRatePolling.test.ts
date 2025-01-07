import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { currencyRateStartPolling, currencyRateStopPollingByPollingToken, } from '../store/actions';
import useCurrencyRatePolling from './useCurrencyRatePolling';
let mockPromises: Promise<string>[];
jest.mock('../store/actions', () => ({
    currencyRateStartPolling: jest.fn().mockImplementation((input) => {
        const promise = Promise.resolve(`${input}_rates`);
        mockPromises.push(promise);
        return promise;
    }),
    currencyRateStopPollingByPollingToken: jest.fn(),
}));
describe('useCurrencyRatePolling', () => {
    beforeEach(() => {
        mockPromises = [];
        jest.clearAllMocks();
    });
    it('should poll currency rates for native currencies when enabled and stop on dismount', async () => {
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: true
            },
            PreferencesController: {
                useCurrencyRateCheck: true
            },
            NetworkController: {
                selectedNetworkClientId: 'selectedNetworkClientId'
            },
            networkConfigurationsByChainId: {
                '0x1': {
                    nativeCurrency: 'ETH',
                    defaultRpcEndpointIndex: 0,
                    rpcEndpoints: [
                        {
                            networkClientId: 'selectedNetworkClientId',
                        },
                    ],
                },
                '0x89': {
                    nativeCurrency: 'BNB',
                    defaultRpcEndpointIndex: 0,
                    rpcEndpoints: [
                        {
                            networkClientId: 'selectedNetworkClientId2',
                        },
                    ],
                },
            }
        };
        const { unmount } = renderHookWithProvider(() => useCurrencyRatePolling(), state);
        await Promise.all(mockPromises);
        expect(currencyRateStartPolling).toHaveBeenCalledTimes(1);
        expect(currencyRateStartPolling).toHaveBeenCalledWith(['ETH', 'BNB']);
        // Stop polling on dismount
        unmount();
        expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(1);
        expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledWith('ETH,BNB_rates');
    });
    it('should not poll if onboarding is not completed', async () => {
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: false
            },
            PreferencesController: {
                useCurrencyRateCheck: true
            },
            networkConfigurationsByChainId: {
                '0x1': { nativeCurrency: 'ETH' },
            }
        };
        renderHookWithProvider(() => useCurrencyRatePolling(), state);
        await Promise.all(mockPromises);
        expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
        expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
    });
    it('should not poll when locked', async () => {
        const state = {
            KeyringController: {
                isUnlocked: false
            },
            OnboardingController: {
                completedOnboarding: true
            },
            PreferencesController: {
                useCurrencyRateCheck: true
            },
            networkConfigurationsByChainId: {
                '0x1': { nativeCurrency: 'ETH' },
            }
        };
        renderHookWithProvider(() => useCurrencyRatePolling(), state);
        await Promise.all(mockPromises);
        expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
        expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
    });
    it('should not poll when currency rate checking is disabled', async () => {
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: true
            },
            PreferencesController: {
                useCurrencyRateCheck: false
            },
            networkConfigurationsByChainId: {
                '0x1': { nativeCurrency: 'ETH' },
            }
        };
        renderHookWithProvider(() => useCurrencyRatePolling(), state);
        await Promise.all(mockPromises);
        expect(currencyRateStartPolling).toHaveBeenCalledTimes(0);
        expect(currencyRateStopPollingByPollingToken).toHaveBeenCalledTimes(0);
    });
});
