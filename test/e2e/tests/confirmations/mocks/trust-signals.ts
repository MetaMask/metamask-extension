import { MockedEndpoint, Mockttp } from '../../../mock-e2e';
import { ResultType } from '../../../../../shared/lib/trust-signals';
import { SECURITY_ALERTS_PROD_API_BASE_URL } from '../../ppom/constants';

/**
 * Mocks the address scan endpoint. If `targetAddress` is provided, only that
 * address (case-insensitive) receives `resultType`; any other scanned address
 * (e.g. a decoded transfer recipient) gets `ResultType.Benign`, so tests that
 * scope a malicious/warning verdict to one address aren't also flagged for
 * unrelated addresses touched by the same transaction.
 *
 * @param mockServer - The mock server to configure
 * @param resultType - The result to return for `targetAddress`, or for every
 * scanned address if `targetAddress` is omitted
 * @param label - The label to include in the mocked response
 * @param targetAddress - The address `resultType` applies to; other scanned
 * addresses get `ResultType.Benign`
 */
export async function mockTrustSignal(
  mockServer: Mockttp,
  resultType: ResultType,
  label = '',
  targetAddress?: string,
): Promise<MockedEndpoint[]> {
  return [
    await mockServer
      .forPost(`${SECURITY_ALERTS_PROD_API_BASE_URL}/address/evm/scan`)
      .thenCallback(async (request) => {
        const body = await request.body.getJson();
        const scannedAddress = (body as { address?: string })?.address;
        const matchesTarget =
          !targetAddress ||
          scannedAddress?.toLowerCase() === targetAddress.toLowerCase();

        return {
          statusCode: 200,
          json: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            result_type: matchesTarget ? resultType : ResultType.Benign,
            label: matchesTarget ? label : '',
          },
        };
      }),
  ];
}
