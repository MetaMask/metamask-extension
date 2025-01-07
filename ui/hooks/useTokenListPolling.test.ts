import { renderHookWithProvider } from '../../test/lib/render-helpers';
import { tokenListStartPolling, tokenListStopPollingByPollingToken, } from '../store/actions';
import useTokenListPolling from './useTokenListPolling';
let mockPromises: Promise<string>[];
jest.mock('../store/actions', () => ({
    tokenListStartPolling: jest.fn().mockImplementation((input) => {
        const promise = Promise.resolve(`${input}_token`);
        mockPromises.push(promise);
        return promise;
    }),
    tokenListStopPollingByPollingToken: jest.fn(),
}));
describe('useTokenListPolling', () => {
    beforeEach(() => {
        mockPromises = [];
        jest.clearAllMocks();
    });
    it('should poll the selected network when enabled, and stop on dismount', async () => {
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: true
            },
            PreferencesController: {
                useExternalServices: true
            },
            NetworkController: {
                selectedNetworkClientId: 'selectedNetworkClientId'
            },
            networkConfigurationsByChainId: {
                '0x1': {
                    chainId: '0x1',
                    rpcEndpoints: [
                        {
                            networkClientId: 'selectedNetworkClientId',
                        },
                    ],
                },
            }
        };
        const { unmount } = renderHookWithProvider(() => useTokenListPolling(), state);
        // Should poll each chain
        await Promise.all(mockPromises);
        expect(tokenListStartPolling).toHaveBeenCalledTimes(1);
        expect(tokenListStartPolling).toHaveBeenCalledWith('0x1');
        // Stop polling on dismount
        unmount();
        expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(1);
        expect(tokenListStopPollingByPollingToken).toHaveBeenCalledWith('0x1_token');
    });
    it('should not poll before onboarding is completed', async () => {
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: false
            },
            PreferencesController: {
                useExternalServices: true
            },
            networkConfigurationsByChainId: {
                '0x1': {},
                '0x89': {},
            }
        };
        renderHookWithProvider(() => useTokenListPolling(), state);
        await Promise.all(mockPromises);
        expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
        expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
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
                useExternalServices: true
            },
            networkConfigurationsByChainId: {
                '0x1': {},
                '0x89': {},
            }
        };
        renderHookWithProvider(() => useTokenListPolling(), state);
        await Promise.all(mockPromises);
        expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
        expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
    });
    it('should not poll when disabled', async () => {
        // disabled when detection, petnames, and simulations are all disabled
        const state = {
            KeyringController: {
                isUnlocked: true
            },
            OnboardingController: {
                completedOnboarding: true
            },
            PreferencesController: {
                useExternalServices: true
            },
            networkConfigurationsByChainId: {
                '0x1': {},
                '0x89': {},
            }
        };
        renderHookWithProvider(() => useTokenListPolling(), state);
        await Promise.all(mockPromises);
        expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
        expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
    });
});
