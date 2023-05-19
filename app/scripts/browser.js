import browser from 'webextension-polyfill';

const {chrome} = globalThis;
Object.defineProperty(globalThis, 'chrome', {value: {}});

export {browser, chrome};
