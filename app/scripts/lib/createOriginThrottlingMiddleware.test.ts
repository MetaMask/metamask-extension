// app/scripts/lib/__tests__/createOriginThrottlingMiddleware.test.ts

import { OriginThrottlingController } from '../controllers/origin-throttling-controller';
import createOriginThrottlingMiddleware, {
  SPAM_FILTER_ACTIVATED_ERROR,
  ExtendedJSONRPCRequest,
} from './createOriginThrottlingMiddleware';

describe('createOriginThrottlingMiddleware', () => {
  let originThrottlingController: OriginThrottlingController;
  let middleware: ReturnType<typeof createOriginThrottlingMiddleware>;

  beforeEach(() => {
    originThrottlingController = {
      isOriginBlockedForConfirmations: jest.fn(),
    } as unknown as OriginThrottlingController;

    middleware = createOriginThrottlingMiddleware({
      originThrottlingController,
    });
  });

  it('should call next if the method is not blockable', async () => {
    const req = {
      method: 'nonBlockableMethod',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    await middleware(req, {}, next, end);

    expect(next).toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });

  it('should end with SPAM_FILTER_ACTIVATED_ERROR if the origin is blocked', async () => {
    const req = {
      method: 'transaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    (
      originThrottlingController.isOriginBlockedForConfirmations as jest.Mock
    ).mockReturnValue(true);

    await middleware(req, {}, next, end);

    expect(end).toHaveBeenCalledWith(SPAM_FILTER_ACTIVATED_ERROR);
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next if the origin is not blocked', async () => {
    const req = {
      method: 'transaction',
      origin: 'testOrigin',
    } as unknown as ExtendedJSONRPCRequest;
    const next = jest.fn();
    const end = jest.fn();

    (
      originThrottlingController.isOriginBlockedForConfirmations as jest.Mock
    ).mockReturnValue(false);

    await middleware(req, {}, next, end);

    expect(next).toHaveBeenCalled();
    expect(end).not.toHaveBeenCalled();
  });
});
