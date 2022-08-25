// This file is for Jest-specific setup only and runs before our Jest tests.
import '@testing-library/jest-dom';

jest.mock('webextension-polyfill', () => {
  return {
    runtime: {
      getManifest: () => ({ manifest_version: 2 }),
    },
  };
});
