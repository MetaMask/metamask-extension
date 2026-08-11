import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import * as browserRuntime from '../../../../shared/lib/browser-runtime.utils';
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

jest.mock('../../../../shared/lib/environment-type', () => ({
  ...jest.requireActual('../../../../shared/lib/environment-type'),
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

const mockClipboardReadText = jest.fn().mockResolvedValue('some mock text');

const COLLIDING_24_WORD_SRP =
  'tumble heart quit undo right legal salute lizard tape unveil art lava filter fee snack fragile duck impact oven come cram tourist casino sort';

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

  it('allows entry to continue when a valid SRP is a prefix of a longer SRP', async () => {
    const onChange = jest.fn();
    const { getByTestId, queryByTestId } = renderWithProvider(
      <SrpInputImport onChange={onChange} />,
    );
    const words = COLLIDING_24_WORD_SRP.split(' ');
    const firstTwelveWords = words.slice(0, 12).join(' ');

    await userEvent.type(
      getByTestId('srp-input-import__srp-note'),
      firstTwelveWords,
    );

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(firstTwelveWords);
    });

    await userEvent.keyboard(' ');

    expect(getByTestId('import-srp__srp-word-12')).toBeInTheDocument();
    expect(onChange).toHaveBeenLastCalledWith('');

    for (let index = 12; index < words.length; index += 1) {
      await userEvent.type(
        getByTestId(`import-srp__srp-word-${index}`),
        words[index],
      );
      if (index < words.length - 1) {
        await userEvent.keyboard(' ');
      }
    }

    await waitFor(() => {
      expect(onChange).toHaveBeenLastCalledWith(COLLIDING_24_WORD_SRP);
    });

    await userEvent.keyboard(' ');

    expect(getByTestId('import-srp__srp-word-23')).toBeInTheDocument();
    expect(queryByTestId('import-srp__srp-word-24')).not.toBeInTheDocument();
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
