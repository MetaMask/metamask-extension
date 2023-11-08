import { type BrowserContext, expect } from '@playwright/test';

export class SaturnAPIClient {
  readonly context: BrowserContext;

  readonly baseUrl: string;

  bearerToken: string;

  constructor(context: BrowserContext) {
    this.context = context;
    this.baseUrl = process.env.MMI_E2E_SATURN_PROD_BASE_URL as string;
    this.bearerToken = '';
  }

  async getSaturnToken() {
    const dataRaw = { secret: `${process.env.MMI_E2E_SATURN_TOKEN_SECRET}` };
    const response = await this.context.request.post(
      `${this.baseUrl}/oauth/admin-token`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(dataRaw),
      },
    );
    expect(response.status()).toBe(200);
    const json = await response.json();
    this.bearerToken = `bearer ${json.access_token}`;
  }

  async getTransactionIdStatus(id: string) {
    const authorization = `${this.bearerToken}`;
    const response = await this.context.request.get(
      `${this.baseUrl}/custodian/transaction/${id}`,
      {
        headers: {
          authorization,
        },
      },
    );
    expect(response.status()).toBe(200);
    const json = await response.json();
    return json.transactionStatus;
  }

  // sign or submit the transaction on the custodian side
  async patchTransactionIdStatus(id: string, newStatus: string) {
    const authorization = `${this.bearerToken}`;
    const dataRaw = { transactionStatus: `${newStatus}` };
    const response = await this.context.request.patch(
      `${this.baseUrl}/custodian/transaction/${id}`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(dataRaw),
      },
    );
    expect(response.status()).toBe(200);
  }

  async getEIP721SignatureTransactionStatusCreated() {
    const authorization = `${this.bearerToken}`;
    const response = await this.context.request.get(
      `${this.baseUrl}/custodian/eip-712-signature?transactionStatuses=created`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
      },
    );
    expect(response.status()).toBe(200);
    const json = await response.json();
    return json;
  }

  async patchEIP721SignatureTransaction(id: string, newStatus: string) {
    const authorization = `${this.bearerToken}`;
    const dataRaw = { transactionStatus: `${newStatus}` };
    const response = await this.context.request.patch(
      `${this.baseUrl}/custodian/eip-712-signature/${id}`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(dataRaw),
      },
    );
    expect(response.status()).toBe(200);
  }

  async getPersonalSignatureTransactionStatusCreated() {
    const authorization = `${this.bearerToken}`;
    const response = await this.context.request.get(
      `${this.baseUrl}/custodian/personal-signature?transactionStatuses=created`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
      },
    );
    expect(response.status()).toBe(200);
    const json = await response.json();
    return json;
  }

  async patchPersonalSignatureTransaction(id: string, newStatus: string) {
    const authorization = `${this.bearerToken}`;
    const dataRaw = { transactionStatus: `${newStatus}` };
    const response = await this.context.request.patch(
      `${this.baseUrl}/custodian/personal-signature/${id}`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
        data: JSON.stringify(dataRaw),
      },
    );
    expect(response.status()).toBe(200);
  }

  async getTestAccount() {
    const authorization = `${this.bearerToken}`;
    const response = await this.context.request.get(
      `${this.baseUrl}/custodian/account/next-test-account`,
      {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
      },
    );
    expect(response.status()).toBe(200);
    const json = await response.json();
    return json;
  }
}
