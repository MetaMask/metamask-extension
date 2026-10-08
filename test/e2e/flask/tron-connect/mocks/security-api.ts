import { Mockttp } from 'mockttp';

const SECURITY_ALERTS_API_URL = 'https://security-alerts.api.cx.metamask.io';

export type TronScanTransactionResponse = {
  validation: {
    status: 'Success' | 'Error';
    // eslint-disable-next-line @typescript-eslint/naming-convention
    result_type: 'Benign' | 'Warning' | 'Malicious' | 'Error';
  };
  simulation: {
    status: 'Success' | 'Error';
    error?: string;
  };
};

// The snap validates this response against its `SecurityAlertResponseStruct`,
// which requires `validation` and `simulation` objects. A benign, successful
// simulation keeps the Confirm button enabled and avoids the scan-error banner.
export const SUCCESSFUL_SCAN_TRANSACTION_RESPONSE: TronScanTransactionResponse =
  {
    validation: {
      status: 'Success',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Benign',
    },
    simulation: {
      status: 'Success',
    },
  };

// JustLend energy rental / TRX staking hits simulator-capability gaps
// (`DelegateResource` / `FreezeBalanceV2`). The snap maps these to skipped
// estimates so Confirm stays enabled (WPN-1938).
export const UNSUPPORTED_CALL_TYPE_SCAN_TRANSACTION_RESPONSE: TronScanTransactionResponse =
  {
    validation: {
      status: 'Success',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      result_type: 'Benign',
    },
    simulation: {
      status: 'Error',
      error: 'Unsupported call type: delegateresourceofenergy',
    },
  };

export const mockScanTransaction = (
  mockServer: Mockttp,
  response: TronScanTransactionResponse = SUCCESSFUL_SCAN_TRANSACTION_RESPONSE,
) =>
  mockServer
    .forPost(`${SECURITY_ALERTS_API_URL}/tron/transaction/scan`)
    .thenJson(200, response);
