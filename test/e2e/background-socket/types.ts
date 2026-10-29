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
    | 'qrSyncSimulate';
  tabs?: chrome.tabs.Tab[];
  title?: string;
  property?: WindowProperties;
  value?: string;
  action?: QrSyncSimulatorAction;
  params?: SimulatorParams;
};

export type Handle = {
  id: string;
  title: string;
  url: string;
};

export type WindowProperties = 'title' | 'url';

export type ServerMochaEventEmitterType = {
  error: [error: Error];
  openTabs: [openTabs: chrome.tabs.Tab[]];
  notFound: [openTabs: chrome.tabs.Tab[]];
};
