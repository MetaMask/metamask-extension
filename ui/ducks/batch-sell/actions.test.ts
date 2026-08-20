import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { MultichainNetworks } from '../../../shared/constants/multichain/networks';
import { getIsSmartTransaction } from '../../../shared/lib/selectors';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { forceUpdateMetamaskState } from '../../store/actions';
import { submitRequestToBackground } from '../../store/background-connection';
import { updateBatchSellTrades } from './actions';

jest.mock('../../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
}));

jest.mock('../../store/actions', () => ({
  ...jest.requireActual('../../store/actions'),
  forceUpdateMetamaskState: jest.fn(),
}));

jest.mock('../../../shared/lib/selectors', () => ({
  ...jest.requireActual('../../../shared/lib/selectors'),
  getIsSmartTransaction: jest.fn(),
}));

const middleware = [thunk];
const MOCK_QUOTES = [{ requestId: 'quote-1' }] as never;

describe('Ducks - Batch Sell actions', () => {
  const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
  const mockForceUpdateMetamaskState = jest.mocked(forceUpdateMetamaskState);
  const mockGetIsSmartTransaction = jest.mocked(getIsSmartTransaction);

  beforeEach(() => {
    jest.clearAllMocks();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockForceUpdateMetamaskState.mockResolvedValue(undefined);
    mockGetIsSmartTransaction.mockReturnValue(false);
  });

  describe('updateBatchSellTrades', () => {
    it('forwards quotes and smart transaction status to the bridge controller', async () => {
      mockGetIsSmartTransaction.mockReturnValue(true);
      const store = configureMockStore(middleware)(createBridgeMockStore());

      await store.dispatch(
        updateBatchSellTrades(MOCK_QUOTES, 'eip155:1') as never,
      );

      expect(mockGetIsSmartTransaction).toHaveBeenCalledWith(
        store.getState(),
        '0x1',
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledTimes(1);
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateBatchSellTrades',
        [MOCK_QUOTES, true],
      );
      expect(mockForceUpdateMetamaskState).toHaveBeenCalledTimes(1);
      expect(mockForceUpdateMetamaskState).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('passes false for smart transactions when they are disabled for the chain', async () => {
      const store = configureMockStore(middleware)(createBridgeMockStore());

      await store.dispatch(
        updateBatchSellTrades(MOCK_QUOTES, 'eip155:1') as never,
      );

      expect(mockGetIsSmartTransaction).toHaveBeenCalledWith(
        store.getState(),
        '0x1',
      );
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateBatchSellTrades',
        [MOCK_QUOTES, false],
      );
    });

    it('passes false for smart transactions on non-EVM chains', async () => {
      const store = configureMockStore(middleware)(createBridgeMockStore());

      await store.dispatch(
        updateBatchSellTrades(MOCK_QUOTES, MultichainNetworks.SOLANA) as never,
      );

      expect(mockGetIsSmartTransaction).not.toHaveBeenCalled();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateBatchSellTrades',
        [MOCK_QUOTES, false],
      );
    });

    it('passes false for smart transactions when the chain is empty', async () => {
      const store = configureMockStore(middleware)(createBridgeMockStore());

      await store.dispatch(updateBatchSellTrades(MOCK_QUOTES, '') as never);

      expect(mockGetIsSmartTransaction).not.toHaveBeenCalled();
      expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
        'updateBatchSellTrades',
        [MOCK_QUOTES, false],
      );
    });
  });
});
