export type FixtureResetStrategy =
  | 'inPlace'
  | 'reload'
  | 'reloadSkipFixtureInitialization';

export type FixtureResetTiming = {
  phase: string;
  ms: number;
};

export type MessageType = {
  command:
    | 'openTabs'
    | 'notFound'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty'
    | 'resetFixtureState'
    | 'fixtureStateReset'
    | 'fixtureStateResetError';
  error?: string;
  id?: string;
  reloadRequired?: boolean;
  status?: string;
  strategy?: FixtureResetStrategy;
  tabs?: chrome.tabs.Tab[];
  timings?: FixtureResetTiming[];
  title?: string;
  property?: WindowProperties;
  value?: string;
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
  fixtureStateReset: [message: MessageType];
  openTabs: [openTabs: chrome.tabs.Tab[]];
  notFound: [openTabs: chrome.tabs.Tab[]];
};
