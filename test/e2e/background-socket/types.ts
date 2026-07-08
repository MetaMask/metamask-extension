export type MessageType = {
  command:
    | 'backgroundError'
    | 'emitPortStreamChunkingTestPayload'
    | 'getPortStreamChunkingTestEventStats'
    | 'openTabs'
    | 'notFound'
    | 'portStreamChunkingTestEventStats'
    | 'portStreamChunkingTestPayloadEmitted'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty';
  byteLength?: number;
  error?: string;
  eventStats?: PortStreamChunkingTestEventStats;
  sampleId?: string;
  tabs?: chrome.tabs.Tab[];
  title?: string;
  property?: WindowProperties;
  value?: string;
};

export type PortStreamChunkingTestEventStats = {
  count: number;
  lastChunkSize?: number;
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
  portStreamChunkingTestEventStats: [
    eventStats: PortStreamChunkingTestEventStats,
  ];
  portStreamChunkingTestPayloadEmitted: [];
};
