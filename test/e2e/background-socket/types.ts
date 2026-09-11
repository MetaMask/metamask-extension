import type {
  QrSyncSimulatorAction,
  SimulatorParams,
} from '../helpers/qr-sync/mobile-wallet-simulator';

export type MessageType = {
  command:
    | 'openTabs'
    | 'notFound'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty'
    | 'qrSyncSimulate'
    | 'fixtureStateReset'
    | 'fixtureStateResetError'
    | 'resetFixtureState';
  tabs?: chrome.tabs.Tab[];
  title?: string;
  property?: WindowProperties;
  value?: string;
  action?: QrSyncSimulatorAction;
  params?: SimulatorParams;
  error?: string;
  reloadServiceWorker?: boolean;
};

export type Handle = {
  id: string;
  title: string;
  url: string;
};

export type WindowProperties = 'title' | 'url';

export type ServerMochaEventEmitterType = {
  connection: [];
  error: [error: Error];
  fixtureStateReset: [];
  openTabs: [openTabs: chrome.tabs.Tab[]];
};
