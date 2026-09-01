import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { sendMetadataHandler, SubjectMetadataToAdd } from './send-metadata';

describe('SendMetaData', () => {
  const paramsData = {
    origin: 'testOrigin',
    iconUrl: 'testicon',
    name: 'testname',
  };

  it('should do nothing and return true', async () => {
    const req = {
      origin: 'testOrigin',
      params: paramsData,
      id: '22',
      jsonrpc: '2.0',
      method: MESSAGE_TYPE.SEND_METADATA,
    } satisfies JsonRpcRequest<SubjectMetadataToAdd> & { origin: string };

    const res: PendingJsonRpcResponse<true> = {
      id: '22',
      jsonrpc: '2.0',
      result: true,
    };

    const mockEnd: JsonRpcEngineEndCallback = jest.fn();
    sendMetadataHandler.implementation(req, res, jest.fn(), mockEnd);
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalled();
  });
});
