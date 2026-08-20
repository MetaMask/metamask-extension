import { MockedEndpoint, Mockttp } from '../../../mock-e2e';
import { ResultType } from '../../../../../shared/lib/trust-signals';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../../ppom/constants';

export async function mockTrustSignal(
  mockServer: Mockttp,
  resultType: ResultType,
  label = '',
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/address/evm/scan`)
      .thenCallback(() => ({
        statusCode: 200,
        json: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          result_type: resultType,
          label,
        },
      })),
  ];
}
