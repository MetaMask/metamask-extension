import { Driver } from './webdriver/driver';
import { Ganache } from './seeder/ganache';
import { Bundler } from './bundler';
import { MockedEndpoint, Mockttp, CompletedRequest } from 'mockttp';

export interface GanacheContractAddressRegistry {
  [key: string]: string;
}

export interface Fixtures {
  driver: Driver;
  contractRegistry?: GanacheContractAddressRegistry;
  ganacheServer?: Ganache;
  secondaryGanacheServer?: Ganache[];
  mockedEndpoint: MockedEndpoint[];
  bundlerServer: Bundler;
  mockServer: Mockttp;
}

export interface GanacheOptions {
  chainId?: number;
  concurrent?: Array<{
    port: number;
    chainId: number;
    ganacheOptions2?: Record<string, unknown>;
  }>;
  accounts?: Array<{
    secretKey: string;
    balance: string;
  }>;
}

export interface MockResponse {
  statusCode: number;
  body?: string | Record<string, unknown>;
  json?: {
    jsonrpc?: string;
    id?: string | number;
    result?: string | Record<string, unknown>;
    error?: {
      code: number;
      message: string;
    };
    [key: string]: unknown;
  };
}

export interface WithFixturesOptions {
  dapp?: boolean;
  fixtures: any;
  ganacheOptions?: GanacheOptions;
  title?: string;
  failOnConsoleError?: boolean;
  dappOptions?: {
    numberOfDapps?: number;
  };
  testSpecificMock?: (mockServer: Mockttp) => Promise<MockedEndpoint[]>;
}

export const tinyDelayMs: number;
export const regularDelayMs: number;
export const largeDelayMs: number;
export const veryLargeDelayMs: number;
export const TEST_SEED_PHRASE: string;
export const WALLET_PASSWORD: string;
export const TEST_SNAPS_WEBSITE_URL: string;
export const TEST_DAPP_WEBSITE_URL: string;
export const defaultGanacheOptions: GanacheOptions;

export function withFixtures(
  options: WithFixturesOptions,
  testSuite: (fixtures: Fixtures) => Promise<void>
): Promise<void>;

export function importSRPOnboardingFlow(
  driver: Driver,
  seedPhrase?: string,
  password?: string
): Promise<void>;

export function loginWithoutBalanceValidation(
  driver: Driver,
  password?: string
): Promise<void>;

export function completeImportSRPOnboardingFlow(
  driver: Driver,
  seedPhrase?: string,
  password?: string
): Promise<void>;

export function completeCreateNewWalletOnboardingFlow(
  driver: Driver,
  password?: string
): Promise<void>;

export function convertToHexValue(val: number | string): string;

export function buildQuote(
  value: number | string,
  fromToken: string,
  toToken: string
): Record<string, unknown>;
