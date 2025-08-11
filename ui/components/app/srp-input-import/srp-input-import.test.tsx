import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import * as browserRuntime from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import SrpInputImport from './srp-input-import';

// Mock the getMnemonicUtil function to avoid network dependencies
jest.mock('../../../../shared/lib/mnemonic/mnemonic', () => ({
  getMnemonicUtil: jest.fn(() =>
    Promise.resolve({
      isValidWord: jest.fn(() => true), // Simple mock that accepts all words
    }),
  ),
}));

const mockClipboardReadText = jest.fn().mockResolvedValue('some mock text');

Object.defineProperty(navigator, 'clipboard', {
  value: {
    readText: mockClipboardReadText,
  },
});

describe('SrpInputImport', () => {
  it('should render', () => {
    const { getByTestId } = renderWithProvider(
      <SrpInputImport onChange={jest.fn()} />,
    );
    expect(getByTestId('srp-input-import__srp-note')).toBeInTheDocument();
  });

  it('should ask for explicit permission to read the clipboard in firefox', async () => {
    jest
      .spyOn(browserRuntime, 'getBrowserName')
      .mockReturnValue(PLATFORM_FIREFOX);

    const { getByTestId } = renderWithProvider(
      <SrpInputImport onChange={jest.fn()} />,
    );
    const pasteButton = getByTestId('srp-input-import__paste-button');
    fireEvent.click(pasteButton);

    await waitFor(() => {
      expect(browser.permissions.request).toHaveBeenCalledWith({
        permissions: ['clipboardRead'],
      });
      expect(mockClipboardReadText).toHaveBeenCalled();
    });
  });
});
