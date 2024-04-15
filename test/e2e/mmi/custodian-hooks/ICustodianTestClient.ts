import { type BrowserContext } from '@playwright/test';

export interface ICustodianTestClient {
  /** This method is expected to be used for initial test setup and to keep the context object in order to manage extra screen actions */
  setup: (context?: BrowserContext) => Promise<void>;

  /** This method should confirm the transaction with txId */
  submitTransactionById: (txId: string) => Promise<string | RegExp>;

  /** This method should cancel the transaction with txId */
  rejectTransactionById: (txId: string) => Promise<string | RegExp>;

  /** This method should sign an specific typed data V3. Parameter signedTransactionTime is provided with the time when the data was signed from dapp */
  signEIP721MessageV3: (signedTransactionTime?: string) => Promise<void>;

  /** This method should sign an specific typed data V4. Parameter signedTransactionTime is provided with the time when the data was signed from dapp */
  signEIP721MessageV4: (signedTransactionTime?: string) => Promise<void>;

  /** This method should cancel the transaction with txId which is a sign typed data tx */
  rejectEIP721Message: (txId: string) => Promise<string | RegExp>;

  /** This method should sign an specific data. Parameter signedTransactionTime is provided with the time when the data was signed from dapp */
  signPersonalSignature: (signedTransactionTime?: string) => Promise<void>;

  /** This method should cancel the transaction with txId which is a sign data tx */
  rejectPersonalSignatureId: (txId: string) => Promise<string | RegExp>;

  /** This method should return the title of an account for test */
  getTestAccount: (token?: string) => Promise<string>;

  /** This method should return the title of an account where funds will be transferred from */
  getAccountFrom: (token?: string) => Promise<string>;

  /** This method should return the title of an account where founds will be transferred to */
  getAccountTo: (token?: string) => Promise<string>;

  /** This method should return the list of account titles to be selected when MMI custodian is connected */
  getSelectedAccounts: () => Promise<string[]>;
}
