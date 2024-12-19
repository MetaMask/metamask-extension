import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import { PendingJsonRpcResponse } from '@metamask/utils';
import { SubjectType } from '@metamask/permission-controller';
import { MESSAGE_TYPE } from '../../../../../shared/constants/app';
import { HandlerRequestType as SendMetadataHandlerRequest } from './types';
import sendMetadata, {
  AddSubjectMetadata,
  SubjectMetadataToAdd,
} from './send-metadata';

describe('SendMetaData', () => {
  let mockEnd: JsonRpcEngineEndCallback;
  let mockAddSubjectMetadata: AddSubjectMetadata;
  const paramsData = {
    origin: 'testOrigin',
    iconUrl: 'testicon',
    name: 'testname',
  };

  beforeEach(() => {
    mockEnd = jest.fn();
    mockAddSubjectMetadata = jest.fn();
  });

  it('should call AddSubjectMetadata when the handler is invoked', async () => {
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

    sendMetadata.implementation(req, res, jest.fn(), mockEnd, {
      addSubjectMetadata: mockAddSubjectMetadata,
      subjectType: SubjectType.Extension,
    });
    expect(mockAddSubjectMetadata).toHaveBeenCalled();
    expect(res.result).toStrictEqual(true);
    expect(mockEnd).toHaveBeenCalled();
  });
});
