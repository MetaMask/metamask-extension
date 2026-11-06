import { MetaMetricsSwapsEventSource } from '@metamask/bridge-controller';
import { BRIDGE_QUOTE_RESPONSE_MIGRATION_PHASE } from '../../../shared/constants/bridge';
import { DummyQuotesWithApproval } from '../../../test/data/bridge/dummy-quotes';
import { setBackgroundConnection } from '../../store/background-connection';
import {
  submitBatchSellTrade,
  submitBridgeIntent,
  submitBridgeTx,
} from './actions';

describe('bridge status background actions', () => {
  describe('submitBridgeTx', () => {
    it('submits the transaction through the messenger', async () => {
      const messengerCall = connectBackground();
      const quote = DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0];

      await submitBridgeTx(
        '0x123',
        quote,
        true,
        // @ts-expect-error - Metrics fields are not relevant to RPC routing.
        {},
        MetaMetricsSwapsEventSource.MainView,
        null,
        [],
        'fiat_value',
      )(jest.fn());

      expect(messengerCall).toHaveBeenCalledWith(
        'BridgeStatusController:submitTx',
        [
          '0x123',
          quote,
          true,
          {},
          MetaMetricsSwapsEventSource.MainView,
          undefined,
          [],
          null,
          undefined,
          'fiat_value',
          BRIDGE_QUOTE_RESPONSE_MIGRATION_PHASE,
        ],
      );
    });
  });

  describe('submitBridgeIntent', () => {
    it('returns the intent result from the messenger', async () => {
      const messengerCall = connectBackground();
      messengerCall.mockResolvedValue('intent-result');
      const params = {
        quoteResponse: DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0],
        accountAddress: '0x123',
        location: MetaMetricsSwapsEventSource.MainView,
      };

      const result = await submitBridgeIntent(params)(jest.fn());

      expect(messengerCall).toHaveBeenCalledWith(
        'BridgeStatusController:submitIntent',
        [{ ...params, migrationPhase: BRIDGE_QUOTE_RESPONSE_MIGRATION_PHASE }],
      );
      expect(result).toBe('intent-result');
    });
  });

  describe('submitBatchSellTrade', () => {
    it('submits the batch through the messenger', async () => {
      const messengerCall = connectBackground();
      const params = {
        quoteResponses: [DummyQuotesWithApproval.ETH_11_USDC_TO_ARB[0], null],
        accountAddress: '0x123',
        isStxEnabled: true,
        tokenSecurityTypeDestination: null,
      };

      await submitBatchSellTrade(params)(jest.fn());

      expect(messengerCall).toHaveBeenCalledWith(
        'BridgeStatusController:submitBatchSell',
        [{ ...params, migrationPhase: BRIDGE_QUOTE_RESPONSE_MIGRATION_PHASE }],
      );
    });

    it('refreshes state after the submission completes', async () => {
      let completeSubmission: () => void = () => undefined;
      const promiseForSubmitting = new Promise<void>((resolve) => {
        completeSubmission = resolve;
      });
      const messengerCall = jest.fn().mockReturnValue(promiseForSubmitting);
      const getStatePatches = jest.fn().mockResolvedValue([]);
      // @ts-expect-error - Only the RPC methods exercised by this test are needed.
      setBackgroundConnection({ messengerCall, getStatePatches });
      const params = {
        quoteResponses: [null],
        accountAddress: '0x123',
        isStxEnabled: false,
      };

      const promiseForDispatching = submitBatchSellTrade(params)(jest.fn());

      expect(getStatePatches).not.toHaveBeenCalled();
      completeSubmission();
      await promiseForDispatching;
      expect(getStatePatches).toHaveBeenCalledTimes(1);
    });
  });
});

/**
 * Connects a mock background RPC endpoint while preserving messenger routing.
 *
 * @returns The messenger RPC mock.
 */
function connectBackground() {
  const messengerCall = jest.fn().mockResolvedValue(undefined);
  // @ts-expect-error - Only the RPC methods exercised by these tests are needed.
  setBackgroundConnection({
    messengerCall,
    getStatePatches: jest.fn().mockResolvedValue([]),
  });
  return messengerCall;
}
