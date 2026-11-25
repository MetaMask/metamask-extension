// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';

// JSDOM does not implement native dialog lifecycle or browser focus isolation.
if (globalThis.HTMLDialogElement) {
  globalThis.HTMLDialogElement.prototype.showModal = function () {
    this.open = true;
  };
  globalThis.HTMLDialogElement.prototype.close = function () {
    if (this.open) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    }
  };
}

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: () => ({ manifest_version: 3 }),
      sendMessage: jest.fn(() => Promise.resolve()),
      onMessage: {
        removeListener: jest.fn(),
        addListener: jest.fn(),
      },
      setUninstallURL: jest.fn(),
    },
  };
});

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

// Setup window.prompt
global.prompt = () => undefined;
