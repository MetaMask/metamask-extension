export type MessageType = {
  command:
    | 'backgroundError'
    | 'emitPortStreamChunkingTestPayload'
    | 'openTabs'
    | 'notFound'
    | 'portStreamChunkingTestPayloadEmitted'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty';
  byteLength?: number;
  error?: string;
  tabs?: chrome.tabs.Tab[];
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
  error: [error: Error];
  openTabs: [openTabs: chrome.tabs.Tab[]];
  notFound: [openTabs: chrome.tabs.Tab[]];
  portStreamChunkingTestPayloadEmitted: [];
};
