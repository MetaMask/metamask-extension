import { MESSAGE_TYPE } from '../../../shared/constants/app';
import {
  RequestData,
  securityProviderCheck,
} from './security-provider-helpers';

describe('securityProviderCheck', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    // Spy on the global fetch function
    fetchSpy = jest.spyOn(global, 'fetch');
    fetchSpy.mockImplementation(async () => {
      return new Response(JSON.stringify('result_mocked'), { status: 200 });
    });
  });

  const paramsMock = {
    origin: 'https://example.com',
    data: 'some_data',
    from: '0x',
  };

  // Utility function to handle different data properties based on methodName
  const getExpectedData = (methodName: string, requestData: RequestData) => {
    switch (methodName) {
      case MESSAGE_TYPE.ETH_SIGN:
      case MESSAGE_TYPE.PERSONAL_SIGN:
        return {
          signer_address: requestData.msgParams?.from,
          msg_to_sign: requestData.msgParams?.data,
        };
      case MESSAGE_TYPE.ETH_SIGN_TYPED_DATA:
        return requestData.messageParams?.data;
      default:
        return {
          from_address: requestData.txParams?.from,
          to_address: requestData.txParams?.to,
          gas: requestData.txParams?.gas,
          gasPrice: requestData.txParams?.gasPrice,
          value: requestData.txParams?.value,
          data: requestData.txParams?.data,
        };
    }
  };

  test.each([
    [MESSAGE_TYPE.ETH_SIGN_TYPED_DATA],
    [MESSAGE_TYPE.ETH_SIGN],
    [MESSAGE_TYPE.PERSONAL_SIGN],
    ['some_other_method'],
  ])(
    'should call fetch with the correct parameters for %s',
    async (methodName: string) => {
      let requestData: RequestData;

      switch (methodName) {
        case MESSAGE_TYPE.ETH_SIGN_TYPED_DATA:
          requestData = {
            origin: 'https://example.com',
            messageParams: paramsMock,
          };
          break;
        case MESSAGE_TYPE.ETH_SIGN:
        case MESSAGE_TYPE.PERSONAL_SIGN:
          requestData = {
            origin: 'https://example.com',
            msgParams: paramsMock,
          };
          break;
        default:
          requestData = {
            origin: 'https://example.com',
            txParams: {
              from: '0x',
              to: '0x',
              gas: 'some_gas',
              gasPrice: 'some_gasPrice',
              value: 'some_value',
              data: 'some_data',
            },
          };
      }

      const result = await securityProviderCheck(
        requestData,
        methodName,
        '1',
        'en',
      );

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      expect(fetchSpy).toHaveBeenCalledWith(
        'https://proxy.metafi.codefi.network/opensea/security/v1/validate',
        expect.objectContaining({
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            host_name:
              methodName === 'some_other_method'
                ? requestData.origin
                : requestData.msgParams?.origin ||
                  requestData.messageParams?.origin,
            rpc_method_name: methodName,
            chain_id: '1',
            data: getExpectedData(methodName, requestData),
            currentLocale: 'en',
          }),
        }),
      );
      expect(result).toEqual('result_mocked');
    },
  );
});
