import { renderWithProvider } from '../../test/jest';
import { renderHookWithProvider } from '../../test/lib/render-helpers';
import {
  tokenListStartPolling,
  tokenListStopPollingByPollingToken,
} from '../store/actions';
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
  beforeEach(() => (mockPromises = []));

  it('should poll for token lists on each chain when enabled, and stop on dismount', async () => {
    const state = {
      metamask: {
        useTokenDetection: true,
        networkConfigurationsByChainId: {
          '0x1': {},
          '0x89': {},
        },
      },
    };

    const { unmount } = renderHookWithProvider(
      () => useTokenListPolling(),
      state,
    );

    // Should poll each chain
    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(2);
    expect(tokenListStartPolling).toHaveBeenCalledWith('0x1');
    expect(tokenListStartPolling).toHaveBeenCalledWith('0x89');

    // Stop polling on dismount
    unmount();
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(2);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledWith(
      '0x1_token',
    );
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledWith(
      '0x89_token',
    );
  });

  it('should not poll when disabled', async () => {
    // disabled when detection, petnames, and simulations are all disabled
    const state = {
      metamask: {
        useTokenDetection: false,
        useTransactionSimulations: false,
        preferences: {
          petnamesEnabled: false,
        },
        networkConfigurationsByChainId: {
          '0x1': {},
          '0x89': {},
        },
      },
    };

    renderHookWithProvider(() => useTokenListPolling(), state);

    await Promise.all(mockPromises);
    expect(tokenListStartPolling).toHaveBeenCalledTimes(0);
    expect(tokenListStopPollingByPollingToken).toHaveBeenCalledTimes(0);
  });
});
