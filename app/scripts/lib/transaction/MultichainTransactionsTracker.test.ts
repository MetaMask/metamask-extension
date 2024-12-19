import { SolAccountType } from '@metamask/keyring-api';
import { createMockInternalAccount } from '../../../../test/jest/mocks';
import { Poller } from '../accounts/Poller';
import { MultichainTransactionsTracker } from './MultichainTransactionsTracker';

const MOCK_TIMESTAMP = 1733788800;

const mockSolanaAccount = createMockInternalAccount({
  address: '',
  name: 'Solana Account',
  type: SolAccountType.DataAccount,
  snapOptions: {
    id: 'mock-solana-snap',
    name: 'mock-solana-snap',
    enabled: true,
  },
});

function setupTracker() {
  const mockUpdateTransactions = jest.fn();
  const tracker = new MultichainTransactionsTracker(mockUpdateTransactions);

  return {
    tracker,
    mockUpdateTransactions,
  };
}

describe('MultichainTransactionsTracker', () => {
  it('starts polling when calling start', async () => {
    const { tracker } = setupTracker();
    const spyPoller = jest.spyOn(Poller.prototype, 'start');

    await tracker.start();
    expect(spyPoller).toHaveBeenCalledTimes(1);
  });

  it('stops polling when calling stop', async () => {
    const { tracker } = setupTracker();
    const spyPoller = jest.spyOn(Poller.prototype, 'stop');

    await tracker.start();
    await tracker.stop();
    expect(spyPoller).toHaveBeenCalledTimes(1);
  });

  it('is not tracking if none accounts have been registered', async () => {
    const { tracker, mockUpdateTransactions } = setupTracker();

    await tracker.start();
    await tracker.updateTransactions();

    expect(mockUpdateTransactions).not.toHaveBeenCalled();
  });

  it('tracks account transactions', async () => {
    const { tracker, mockUpdateTransactions } = setupTracker();

    await tracker.start();
    tracker.track(mockSolanaAccount.id, 0);
    await tracker.updateTransactions();

    expect(mockUpdateTransactions).toHaveBeenCalledWith(mockSolanaAccount.id, {
      limit: 10,
    });
  });

  it('untracks account transactions', async () => {
    const { tracker, mockUpdateTransactions } = setupTracker();

    await tracker.start();
    tracker.track(mockSolanaAccount.id, 0);
    await tracker.updateTransactions();
    expect(mockUpdateTransactions).toHaveBeenCalledWith(mockSolanaAccount.id, {
      limit: 10,
    });

    tracker.untrack(mockSolanaAccount.id);
    await tracker.updateTransactions();
    expect(mockUpdateTransactions).toHaveBeenCalledTimes(1);
  });

  it('tracks account after being registered', async () => {
    const { tracker } = setupTracker();

    await tracker.start();
    tracker.track(mockSolanaAccount.id, 0);
    expect(tracker.isTracked(mockSolanaAccount.id)).toBe(true);
  });

  it('does not track account if not registered', async () => {
    const { tracker } = setupTracker();

    await tracker.start();
    expect(tracker.isTracked(mockSolanaAccount.id)).toBe(false);
  });

  it('does not refresh transactions if they are considered up-to-date', async () => {
    const { tracker, mockUpdateTransactions } = setupTracker();

    const blockTime = 400;
    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => new Date(MOCK_TIMESTAMP).getTime());

    await tracker.start();
    tracker.track(mockSolanaAccount.id, blockTime);
    await tracker.updateTransactions();
    expect(mockUpdateTransactions).toHaveBeenCalledTimes(1);

    await tracker.updateTransactions();
    expect(mockUpdateTransactions).toHaveBeenCalledTimes(1);

    jest
      .spyOn(global.Date, 'now')
      .mockImplementation(() => new Date(MOCK_TIMESTAMP + blockTime).getTime());

    await tracker.updateTransactions();
    expect(mockUpdateTransactions).toHaveBeenCalledTimes(2);
  });
});
