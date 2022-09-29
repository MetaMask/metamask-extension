// This file is for Jest-specific setup only and runs before our Jest tests.

import nock from 'nock';
import '@testing-library/jest-dom';

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: () => ({ manifest_version: 2 }),
    },
  };
});

/* eslint-disable-next-line jest/require-top-level-describe */
beforeEach(() => {
  nock.cleanAll();
});
