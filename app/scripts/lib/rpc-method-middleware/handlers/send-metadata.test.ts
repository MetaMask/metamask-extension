import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import { PendingJsonRpcResponse } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerRequestType as SendMetadataHandlerRequest } from './types';
import sendMetadata, { SubjectMetadataToAdd } from './send-metadata';

describe('SendMetaData', () => {
  const paramsData = {
    origin: 'testOrigin',
    iconUrl: 'testicon',
    name: 'testname',
  };

  it('should do nothing and return true', async () => {
    const req: SendMetadataHandlerRequest<SubjectMetadataToAdd> = {
      origin: 'testOrigin',
      params: paramsData,
      id: '22',
      jsonrpc: '2.0',
      method: MESSAGE_TYPE.SEND_METADATA,
    };

    const res: PendingJsonRpcResponse<true> = {
      id: '22',
      jsonrpc: '2.0',
      result: true,
    };

    const mockEnd: JsonRpcEngineEndCallback = jest.fn();
    sendMetadata.implementation(req, res, jest.fn(), mockEnd);
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalled();
  });
});
