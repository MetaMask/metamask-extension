import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://security-alerts.api.cx.metamask.io';

// The snap validates this response against its `SecurityAlertResponseStruct`,
// which requires `validation` and `simulation` objects. A benign, successful
// simulation keeps the Confirm button enabled and avoids the scan-error banner.
export const mockScanTransaction = (mockServer: Mockttp) =>
  mockServer.forPost(`${PRICE_API_URL}/tron/transaction/scan`).thenJson(200, {
    validation: {
      status: 'Success',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Benign',
    },
    simulation: {
      status: 'Success',
    },
  });
