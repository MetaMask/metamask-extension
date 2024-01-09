import axios from 'axios';
import { expect } from '@playwright/test';
import { generateAccounts } from '../helpers/utils';
import { type ICustodianTestClient } from './ICustodianTestClient';

const baseUrl = process.env.MMI_E2E_SATURN_BASE_URL;

export class CustodianTestClient implements ICustodianTestClient {
  bearerToken: string;

  constructor() {
    this.bearerToken = '';
  }

  public async setup() {
    this.bearerToken = await this.getCustodianAuthToken();
  }

  private async getCustodianAuthToken() {
    const dataRaw = { secret: `${process.env.MMI_E2E_SATURN_TOKEN_SECRET}` };
    return (await axios
      .post(`${baseUrl}/oauth/admin-token`, JSON.stringify(dataRaw), {
        headers: {
          'Content-Type': 'application/json',
        },
      })
      .then(function (response) {
        expect(response.status).toBe(200);
        return `bearer ${response.data.access_token}`;
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      })) as string;
  }

  public async getTestAccount(): Promise<string> {
    const authorization = this.bearerToken;
    return await axios
      .get(`${baseUrl}/custodian/account/next-test-account`, {
        headers: {
          authorization,
          'Content-Type': 'application/json',
        },
      })
      .then(function (response) {
        expect(response.status).toBe(200);
        return response.data.name;
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  public async getAccountFrom(): Promise<string> {
    return await this.getTestAccount();
  }

  public async getAccountTo(): Promise<string> {
    return await this.getTestAccount();
  }

  public async getSelectedAccounts(): Promise<string[]> {
    return generateAccounts();
  }

  private async patchTxStatusById(custodianTxId: string, newStatus: string) {
    const authorization = this.bearerToken;
    const dataRaw = { transactionStatus: `${newStatus}` };
    await axios
      .patch(
        `${baseUrl}/custodian/transaction/${custodianTxId}`,
        JSON.stringify(dataRaw),
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
      })
      .catch(function (error) {
        console.error(error.response.data);
        throw error;
      });
    return newStatus;
  }

  public async rejectTransactionById(
    custodianTxId: string,
  ): Promise<string | RegExp> {
    return await this.patchTxStatusById(custodianTxId, 'aborted');
  }

  public async submitTransactionById(
    custodianTxId: string,
  ): Promise<string | RegExp> {
    const statuses = ['signed', 'submitted'];
    for (const status of statuses) {
      await this.patchTxStatusById(custodianTxId, status);
    }
    return /submitted|mined/iu;
  }

  public async signEIP721MessageV4(signedTransactionTime?: string) {
    // Sign Typed Data
    const id = await this.getTxByMessageContentCreated(signedTransactionTime);
    const authorization = this.bearerToken;
    const dataRaw = { transactionStatus: 'signed' };
    await axios
      .patch(
        `${baseUrl}/custodian/eip-712-signature/${id}`,
        JSON.stringify(dataRaw),
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  public async signEIP721MessageV3(signedTransactionTime?: string) {
    const maxRetries = 3;
    const retryInterval = 3000;
    let retries = 0;
    let transaction: any;
    while (retries < maxRetries) {
      try {
        // Sign Typed Data
        transaction = await this.getEIP721TransactionStatusCreatedByTimestamp(
          signedTransactionTime as string,
        );
        if (!transaction) {
          throw Error(
            '🥲 Tx not found -> getEIP721TransactionStatusCreatedByTimestamp. Retrying...',
          );
        }
        break;
      } catch (error) {
        console.log(error);
        retries += 1;
        if (retries < maxRetries) {
          console.log(`Retrying in ${retryInterval / 1000} seconds...`);
          await new Promise((resolve) => setTimeout(resolve, retryInterval));
        } else {
          throw error(
            `👎 Max retries (${maxRetries}) reached. Saturn tx not found.`,
          );
        }
      }
    }

    const authorization = this.bearerToken;
    const dataRaw = { transactionStatus: 'signed' };
    await axios
      .patch(
        `${baseUrl}/custodian/eip-712-signature/${transaction.id}`,
        JSON.stringify(dataRaw),
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  private async getTxByMessageContentCreated(
    signedTransactionTime: string | undefined,
  ) {
    const maxRetries = 3;
    const retryInterval = 3000;
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const transactions = await this.getEIP721TransactionStatusCreated();
        const { id } = transactions.find(
          (transaction: any) =>
            transaction?.payload?.message?.contents === signedTransactionTime,
        );
        return id;
      } catch (e) {
        console.error(
          '🥲 Tx not found -> getEIP721TransactionStatusCreated. Retrying...',
        );
      }
      retries += 1;
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryInterval / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
    throw new Error(
      `👎 Max retries (${maxRetries}) reached. Saturn tx not found.`,
    );
  }

  public async signPersonalSignature(signedTransactionTime?: string) {
    // Sign Typed Data
    const transaction =
      await this.getPersonalSignatureTransactionStatusCreatedByTimestamp(
        signedTransactionTime as string,
      );

    const authorization = this.bearerToken;
    const dataRaw = { transactionStatus: 'signed' };
    await axios
      .patch(
        `${baseUrl}/custodian/personal-signature/${transaction.id}`,
        JSON.stringify(dataRaw),
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  private async getPersonalSignatureTransactionStatusCreatedByTimestamp(
    signedTransactionTime: string,
  ) {
    const maxRetries = 3;
    const retryInterval = 3000;
    let retries = 0;
    while (retries < maxRetries) {
      try {
        const transactions =
          await this.getPersonalSignatureTransactionStatusCreated();
        // Throw an error if transactions is undefined or its size is 0
        if (!transactions || transactions.length === 0) {
          throw new Error('No transactions found.');
        }
        // get the tx with closest to signedTransactionTime
        const diffTime = transactions.map((tx: { createdAt: string }) =>
          Math.abs(
            new Date(tx.createdAt).getTime() -
              parseInt(signedTransactionTime, 10),
          ),
        );
        const min = Math.min(...diffTime);
        const index = diffTime.indexOf(min);
        return transactions[index];
      } catch (e) {
        console.error(e);
      }
      retries += 1;
      if (retries < maxRetries) {
        console.log(`Retrying in ${retryInterval / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, retryInterval));
      }
    }
    throw new Error(
      `👎 Max retries (${maxRetries}) reached. Personal Signature tx not found.`,
    );
  }

  async getEIP721TransactionStatusCreatedByTimestamp(
    signedTransactionTime: string,
  ) {
    const transactions = await this.getEIP721TransactionStatusCreated();
    // get the tx with closest to signedTransactionTime
    const diffTime = transactions.map((tx: { createdAt: string }) =>
      Math.abs(
        new Date(tx.createdAt).getTime() - parseInt(signedTransactionTime, 10),
      ),
    );
    const min = Math.min(...diffTime);
    const index = diffTime.indexOf(min);
    return transactions[index];
  }

  async getPersonalSignatureTransactionStatusCreated(): Promise<any[]> {
    const authorization = this.bearerToken;
    return await axios
      .get(
        `${baseUrl}/custodian/personal-signature?transactionStatuses=created`,
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
        return response.data;
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  async getEIP721TransactionStatusCreated(): Promise<any[]> {
    const authorization = this.bearerToken;
    return await axios
      .get(
        `${baseUrl}/custodian/eip-712-signature?transactionStatuses=created`,
        {
          headers: {
            authorization,
            'Content-Type': 'application/json',
          },
        },
      )
      .then(function (response) {
        expect(response.status).toBe(200);
        return response.data;
      })
      .catch(function (error) {
        console.log(error.response.data);
        throw error;
      });
  }

  async rejectEIP721Message(txId: string): Promise<string | RegExp> {
    return txId;
  }

  async rejectPersonalSignatureId(txId: string): Promise<string | RegExp> {
    return txId;
  }
}
