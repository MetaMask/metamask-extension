/* eslint-disable @typescript-eslint/no-explicit-any */

import { MESSAGE_TYPE } from '../../../shared/constants/app';
import createTracingMiddleware from './createTracingMiddleware';

const REQUEST_MOCK = {
  id: 'testId',
  method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
} as any;

const RESPONSE_MOCK = {};
const NEXT_MOCK = jest.fn();

describe('createTracingMiddleware', () => {
  let request: any;

  beforeEach(() => {
    jest.resetAllMocks();

    request = { ...REQUEST_MOCK };

    global.sentry = {
      getMetaMetricsEnabled: () => Promise.resolve(true),
    };
  });

  it('adds trace context to request if method is send transaction', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeDefined();
  });

  it('does not add trace context to request if method not supported', async () => {
    request.method = MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4;

    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(request.traceContext).toBeUndefined();
  });

  it('calls next', async () => {
    await createTracingMiddleware()(request, RESPONSE_MOCK, NEXT_MOCK);

    expect(NEXT_MOCK).toHaveBeenCalledTimes(1);
  });
});
