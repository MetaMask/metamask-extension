import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as browserRuntime from '../../../../shared/modules/browser-runtime.utils';
import {
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import SrpInputImport from './srp-input-import';

const mockPermissionsRequest = jest.fn().mockResolvedValue(true);

jest.mock('webextension-polyfill', () => ({
  permissions: {
    request: (...args: unknown[]) => mockPermissionsRequest(...args),
  },
}));

const mockGetEnvironmentType = jest.fn().mockReturnValue('popup');

jest.mock('../../../../app/scripts/lib/util', () => ({
  ...jest.requireActual('../../../../app/scripts/lib/util'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

const mockClipboardReadText = jest.fn().mockResolvedValue('some mock text');

Object.defineProperty(navigator, 'clipboard', {
  value: {
    readText: mockClipboardReadText,
  },
});

describe('SrpInputImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue('popup');
    jest.spyOn(window, 'focus').mockImplementation(() => undefined);
  });

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
      expect(mockPermissionsRequest).toHaveBeenCalledWith({
        permissions: ['clipboardRead'],
      });
      expect(mockClipboardReadText).toHaveBeenCalled();
    });
  });

  it('should ask for explicit permission and focus textarea before reading clipboard in Chrome side panel', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);

    const { getByTestId } = renderWithProvider(
      <SrpInputImport onChange={jest.fn()} />,
    );
    const textarea = getByTestId('srp-input-import__srp-note');
    const focusSpy = jest.spyOn(textarea, 'focus');

    const pasteButton = getByTestId('srp-input-import__paste-button');
    fireEvent.click(pasteButton);

    await waitFor(() => {
      expect(mockPermissionsRequest).toHaveBeenCalledWith({
        permissions: ['clipboardRead'],
      });
      expect(focusSpy).toHaveBeenCalled();
      expect(mockClipboardReadText).toHaveBeenCalled();
    });
  });
});
