import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as browserRuntime from '../../../../shared/modules/browser-runtime.utils';
import {
  ENVIRONMENT_TYPE_SIDEPANEL,
  PLATFORM_FIREFOX,
} from '../../../../shared/constants/app';
import {
  ClipboardAction,
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';
import SrpInputImport from './srp-input-import';

const mockPermissionsRequest = jest.fn().mockResolvedValue(true);
const mockPermissionsContains = jest.fn().mockResolvedValue(false);

jest.mock('webextension-polyfill', () => ({
  permissions: {
    request: (...args: unknown[]) => mockPermissionsRequest(...args),
    contains: (...args: unknown[]) => mockPermissionsContains(...args),
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

const mockSendMessage = jest.fn();

describe('SrpInputImport', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue('popup');
    jest.spyOn(window, 'focus').mockImplementation(() => undefined);

    // Mock chrome.runtime.sendMessage for offscreen clipboard fallback
    globalThis.chrome = {
      ...globalThis.chrome,
      runtime: {
        ...globalThis.chrome?.runtime,
        sendMessage: mockSendMessage,
      },
    } as unknown as typeof chrome;
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

  it('should skip permissions.request when clipboardRead is already granted in Chrome side panel', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    // Simulate permission already granted on mount
    mockPermissionsContains.mockResolvedValue(true);

    const { getByTestId } = renderWithProvider(
      <SrpInputImport onChange={jest.fn()} />,
    );

    // Wait for the useEffect to resolve permissions.contains
    await waitFor(() => {
      expect(mockPermissionsContains).toHaveBeenCalledWith({
        permissions: ['clipboardRead'],
      });
    });

    const pasteButton = getByTestId('srp-input-import__paste-button');
    fireEvent.click(pasteButton);

    await waitFor(() => {
      // permissions.request should NOT be called — cached permission skips it
      expect(mockPermissionsRequest).not.toHaveBeenCalled();
      expect(mockClipboardReadText).toHaveBeenCalled();
    });
  });

  it('should fall back to offscreen clipboard read when document is not focused in Chrome side panel', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_SIDEPANEL);
    // First readText call fails (permission dialog stole focus)
    mockClipboardReadText.mockRejectedValueOnce(
      new Error('Document is not focused'),
    );
    // Offscreen document returns clipboard text
    mockSendMessage.mockResolvedValueOnce({
      success: true,
      text: 'test word1 word2 word3',
    });

    const { getByTestId } = renderWithProvider(
      <SrpInputImport onChange={jest.fn()} />,
    );

    const pasteButton = getByTestId('srp-input-import__paste-button');
    fireEvent.click(pasteButton);

    await waitFor(() => {
      expect(mockClipboardReadText).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.clipboardOffscreen,
        action: ClipboardAction.readClipboard,
      });
    });
  });
});
