export type MessageType = {
  command:
    | 'openTabs'
    | 'notFound'
    | 'queryTabs'
    | 'waitUntilWindowWithProperty';
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
  openTabs: [openTabs: chrome.tabs.Tab[]];
  notFound: [openTabs: chrome.tabs.Tab[]];
};
