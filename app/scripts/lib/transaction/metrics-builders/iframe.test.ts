/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/naming-convention */
import { TransactionMetaMetricsEvent } from '../../../../../shared/constants/transaction';
import { getIframeMetricsProperties } from './iframe';
import { createBuilderRequest } from './test-utils';

describe('iframe builder', () => {
  it('returns iframe properties when frame context is recorded for the transaction', async () => {
    const baseRequest = createBuilderRequest();
    const transactionMetricsRequest = {
      ...baseRequest.transactionMetricsRequest,
      getTransactionFrameContext: jest.fn().mockReturnValue({
        frameId: 1,
        mainFrameOrigin: 'https://top-level.example',
      }),
    };

    const result = await getIframeMetricsProperties({
      ...baseRequest,
      transactionMetricsRequest,
      transactionMeta: {
        ...baseRequest.transactionMeta,
        id: 'tx-1',
        origin: 'https://iframe.example',
      } as any,
    });

    expect(
      transactionMetricsRequest.getTransactionFrameContext,
    ).toHaveBeenCalledWith('tx-1');
    expect(result.properties).toStrictEqual({
      is_iframe: true,
      is_cross_origin_iframe: true,
      iframe_origin: 'https://iframe.example',
      top_level_origin: 'https://top-level.example',
    });
  });

  it('returns top-level frame properties for recorded same-origin frames', async () => {
    const baseRequest = createBuilderRequest();
    const transactionMetricsRequest = {
      ...baseRequest.transactionMetricsRequest,
      getTransactionFrameContext: jest.fn().mockReturnValue({
        frameId: 0,
        mainFrameOrigin: 'https://dapp.example',
      }),
    };

    const result = await getIframeMetricsProperties({
      ...baseRequest,
      transactionMetricsRequest,
      transactionMeta: {
        ...baseRequest.transactionMeta,
        id: 'tx-2',
        origin: 'https://dapp.example',
      } as any,
    });

    expect(result.properties).toStrictEqual({
      is_iframe: false,
      is_cross_origin_iframe: false,
      iframe_origin: null,
      top_level_origin: null,
    });
  });

  it('returns no properties when no frame context is recorded', async () => {
    const baseRequest = createBuilderRequest();
    const transactionMetricsRequest = {
      ...baseRequest.transactionMetricsRequest,
      getTransactionFrameContext: jest.fn().mockReturnValue(undefined),
    };

    const result = await getIframeMetricsProperties({
      ...baseRequest,
      transactionMetricsRequest,
      transactionMeta: {
        ...baseRequest.transactionMeta,
        id: 'tx-3',
        origin: 'https://dapp.example',
      } as any,
    });

    expect(result.properties).toStrictEqual({});
    expect(result.sensitiveProperties).toStrictEqual({});
  });

  const eventNames: TransactionMetaMetricsEvent[] = [
    TransactionMetaMetricsEvent.added,
    TransactionMetaMetricsEvent.approved,
    TransactionMetaMetricsEvent.submitted,
    TransactionMetaMetricsEvent.finalized,
    TransactionMetaMetricsEvent.rejected,
  ];

  eventNames.forEach((eventName) => {
    it(`reads frame context for ${eventName} events from a single source`, async () => {
      const baseRequest = createBuilderRequest();
      const getTransactionFrameContext = jest.fn().mockReturnValue({
        frameId: 1,
        mainFrameOrigin: 'https://top-level.example',
      });

      await getIframeMetricsProperties({
        ...baseRequest,
        eventName,
        transactionMetricsRequest: {
          ...baseRequest.transactionMetricsRequest,
          getTransactionFrameContext,
        },
        transactionMeta: {
          ...baseRequest.transactionMeta,
          id: 'tx-4',
          origin: 'https://iframe.example',
        } as any,
      });

      expect(getTransactionFrameContext).toHaveBeenCalledWith('tx-4');
    });
  });
});
