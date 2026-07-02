export type MessageType =
  | { command: 'fixtureStateReset' }
  | { command: 'fixtureStateResetError'; error: string }
  | { command: 'openTabs'; tabs: chrome.tabs.Tab[] }
  | {
      command: 'notFound';
      property: WindowProperties;
      value: string;
      tabs: chrome.tabs.Tab[];
    }
  | { command: 'queryTabs'; title: string }
  | { command: 'resetFixtureState'; reloadServiceWorker: boolean }
  | {
      command: 'waitUntilWindowWithProperty';
      property: WindowProperties;
      value: string;
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
