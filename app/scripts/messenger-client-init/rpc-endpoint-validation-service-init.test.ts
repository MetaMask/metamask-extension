import { RpcEndpointValidationService } from '../services/rpc-endpoint-validation-service';
import { getRootMessenger } from '../lib/messenger';
import { buildControllerInitRequestMock } from './test/utils';
import { getRpcEndpointValidationServiceMessenger } from './messengers/rpc-endpoint-validation-service-messenger';
import { RpcEndpointValidationServiceInit } from './rpc-endpoint-validation-service-init';

describe('RpcEndpointValidationServiceInit', () => {
  it('exposes only fixed-method endpoint validation without persisting service state', async () => {
    const validate = jest
      .spyOn(RpcEndpointValidationService.prototype, 'validateRpcEndpoint')
      .mockResolvedValue('0x1');
    const request = {
      ...buildControllerInitRequestMock(),
      controllerMessenger:
        getRpcEndpointValidationServiceMessenger(
          getRootMessenger<never, never>(),
        ),
      initMessenger: undefined,
    };

    const result = RpcEndpointValidationServiceInit(request);

    expect(result.messengerClient).toBeInstanceOf(RpcEndpointValidationService);
    expect(result.memStateKey).toBeNull();
    expect(result.persistedStateKey).toBeNull();
    expect(Object.keys(result.api ?? {})).toStrictEqual([
      'validateRpcEndpoint',
    ]);
    await expect(
      result.api?.validateRpcEndpoint('https://rpc.example'),
    ).resolves.toBe('0x1');
    expect(validate).toHaveBeenCalledWith('https://rpc.example');
  });
});
