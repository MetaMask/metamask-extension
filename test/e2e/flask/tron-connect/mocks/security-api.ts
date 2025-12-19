import { Mockttp } from 'mockttp';

const PRICE_API_URL = 'https://security-alerts.api.cx.metamask.io';

export const mockScanTransaction = (mockServer: Mockttp) =>
  mockServer
    .forPost(`${PRICE_API_URL}/tron/transaction/scan`)
    .thenJson(200, {
      status: 'SUCCESS',
      block: "78465629",
      chain: "tron",
      account_address: "TJ3QZbBREK1Xybe1jf4nR9Attb8i54vGS3"
    });
