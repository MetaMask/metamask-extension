// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';

jest.mock('webextension-polyfill', () => {
  const browserMock = {
    runtime: {
      getManifest: () => ({ manifest_version: 3 }),
      onMessage: {
        removeListener: jest.fn(),
        addListener: jest.fn(),
      },
    },
  };

  return {
    __esModule: true,
    ...browserMock,
    default: browserMock,
  };
});

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});

// Setup window.prompt
global.prompt = () => undefined;
