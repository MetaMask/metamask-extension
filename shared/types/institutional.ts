import { CustodyAccountDetails } from '@metamask-institutional/custody-controller';
import {
  ConnectionRequest,
  ConnectRequest,
  IApiCallLogEntry,
  ITransactionStatusMap,
} from '@metamask-institutional/types';
import { Json } from '@metamask/utils';

export type CustodyControllerState = {
  custodyAccountDetails: { [address: string]: CustodyAccountDetails };
  apiRequestLogs: IApiCallLogEntry[];
  custodianConnectRequest: Record<string, Json>;
  custodyStatusMaps?: { [custodyType: string]: ITransactionStatusMap };
  custodianSupportedChains?: CustodianSupportedChains;
  waitForConfirmDeepLinkDialog?: string;
};

type CustodianSupportedChains = {
  [address: string]: {
    supportedChains: string[];
    custodianName: string;
  };
};

export type InstitutionalFeaturesControllerState = {
  institutionalFeatures: {
    connectRequests: InstitutionalConnectRequest[];
    channelId: null;
    connectionRequest: ConnectionRequest | null;
  };
};

type InstitutionalConnectRequest = {
  origin: string;
  method: string;
  token: string;
  labels: { key: string; value: unknown }[];
  feature: string;
  service: string;
  chainId?: string;
  environment?: string;
} & ConnectRequest;

export type MmiConfigurationControllerState = {
  mmiConfiguration: {
    portfolio: {
      enabled: boolean;
      url: string;
      cookieSetUrls: string[];
    };
    features: {
      websocketApi: boolean;
    };
    custodians: Custodian[];
  };
};

export type Custodian = {
  type: string;
  name: string;
  onboardingUrl: string;
  website: string;
  envName: string;
  apiUrl: string;
  apiVersion: string;
  iconUrl: string;
  displayName: string;
  isNoteToTraderSupported: boolean;
  custodianPublishesTransaction: boolean;
  refreshTokenUrl: string;
  websocketApiUrl: string;
  isQRCodeSupported: boolean;
  production: boolean;
  version: number;
};
