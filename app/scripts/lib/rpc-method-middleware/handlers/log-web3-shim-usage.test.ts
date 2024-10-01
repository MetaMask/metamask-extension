import { PendingJsonRpcResponse } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerRequestType } from './types';
import logWeb3ShimUsage, {
  GetWeb3ShimUsageState,
  SetWeb3ShimUsageRecorded,
} from './log-web3-shim-usage';

describe('logWeb3ShimUsage', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockEnd: jest.Mock<any, any, any>;
  let mockGetWeb3ShimUsageState: GetWeb3ShimUsageState;
  let mockSetWeb3ShimUsageRecorded: SetWeb3ShimUsageRecorded;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockGetWeb3ShimUsageState = jest.fn().mockReturnValue(undefined);
    mockSetWeb3ShimUsageRecorded = jest.fn();
  });

  it('should call getWeb3ShimUsageState and setWeb3ShimUsageRecorded when the handler is invoked', async () => {
    const req: HandlerRequestType = {
      origin: 'testOrigin',
      params: [],
      id: '22',
      jsonrpc: '2.0',
      method: MESSAGE_TYPE.LOG_WEB3_SHIM_USAGE,
    };

    const res: PendingJsonRpcResponse<true> = {
      id: '22',
      jsonrpc: '2.0',
      result: true,
    };

    logWeb3ShimUsage.implementation(req, res, jest.fn(), mockEnd, {
      getWeb3ShimUsageState: mockGetWeb3ShimUsageState,
      setWeb3ShimUsageRecorded: mockSetWeb3ShimUsageRecorded,
    });

    expect(mockGetWeb3ShimUsageState).toHaveBeenCalledWith(req.origin);
    expect(mockSetWeb3ShimUsageRecorded).toHaveBeenCalled();
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalled();
  });
});
