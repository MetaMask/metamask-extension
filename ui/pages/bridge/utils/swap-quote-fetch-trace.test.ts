import {
  ChainId,
  QuoteStreamCompleteReason,
  formatChainIdToCaip,
} from '@metamask/bridge-controller';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { swapQuoteFetchTrace } from './swap-quote-fetch-trace';

const mockTrace = jest.fn();
const mockEndTrace = jest.fn();

jest.mock('../../../../shared/lib/trace', () => {
  const actual = jest.requireActual('../../../../shared/lib/trace');
  return {
    ...actual,
    trace: (...args: unknown[]) => mockTrace(...args),
    endTrace: (...args: unknown[]) => mockEndTrace(...args),
  };
});

jest.mock('uuid', () => ({ v4: () => 'quote-trace-id' }));

describe('swapQuoteFetchTrace', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('starts a trace with quote request attributes', () => {
    const srcChainId = formatChainIdToCaip(ChainId.ETH);
    const destChainId = formatChainIdToCaip(ChainId.LINEA);

    expect(
      swapQuoteFetchTrace.start({ srcChainId, destChainId, isRefresh: true }),
    ).toBe('quote-trace-id');
    expect(mockTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.SwapQuoteFetch,
        op: TraceOperation.BridgeDataFetch,
        id: 'quote-trace-id',
        data: expect.objectContaining({
          /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
          request_id: 'quote-trace-id',
          isRefresh: true,
          swap_type: 'crosschain',
          src_chain_id: srcChainId,
          dest_chain_id: destChainId,
          /* eslint-enable @typescript-eslint/naming-convention */
        }),
      }),
    );

    swapQuoteFetchTrace.finish('success');
  });

  it('cancels an active trace before starting a new request', () => {
    swapQuoteFetchTrace.start({ isRefresh: false });
    swapQuoteFetchTrace.start({ isRefresh: false });

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        name: TraceName.SwapQuoteFetch,
        id: 'quote-trace-id',
        data: { result: 'cancelled' },
      }),
    );
    swapQuoteFetchTrace.finish('success');
  });

  it('records the no-quote reason', () => {
    swapQuoteFetchTrace.start({ isRefresh: false });
    swapQuoteFetchTrace.finish(
      'no_quotes',
      undefined,
      QuoteStreamCompleteReason.AMOUNT_TOO_HIGH,
    );

    expect(mockEndTrace).toHaveBeenCalledWith(
      expect.objectContaining({
        /* eslint-disable @typescript-eslint/naming-convention -- Sentry trace attributes use snake_case */
        data: {
          result: 'no_quotes',
          no_quote_reason: QuoteStreamCompleteReason.AMOUNT_TOO_HIGH,
        },
        /* eslint-enable @typescript-eslint/naming-convention */
      }),
    );
  });
});
