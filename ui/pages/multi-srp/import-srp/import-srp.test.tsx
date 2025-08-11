import React from 'react';
import {
  createEvent,
  fireEvent,
  RenderResult,
  waitFor,
} from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import { importMnemonicToVault } from '../../../store/actions';
import { ImportSrp } from './import-srp';

const mockClearClipboard = jest.fn();
const mockLockAccountSyncing = jest.fn();
const mockUnlockAccountSyncing = jest.fn();

jest.mock('../../../helpers/utils/util', () => ({
  clearClipboard: () => mockClearClipboard(),
}));

const VALID_SECRET_RECOVERY_PHRASE =
  'input turtle oil scorpion exile useless dry foster vessel knee area label';

jest.mock('../../../store/actions', () => ({
  importMnemonicToVault: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(null)),
  showAlert: jest.fn().mockReturnValue({ type: 'ALERT_OPEN' }),
  hideAlert: jest.fn().mockReturnValue({ type: 'ALERT_CLOSE' }),
  hideWarning: jest.fn().mockReturnValue({ type: 'HIDE_WARNING' }),
  lockAccountSyncing: jest.fn().mockReturnValue(() => mockLockAccountSyncing()),
  unlockAccountSyncing: jest
    .fn()
    .mockReturnValue(() => mockUnlockAccountSyncing()),
}));

const pasteSrpIntoFirstInput = (render: RenderResult, srp: string) => {
  const [firstWord] = srp.split(' ');

  const firstSrpWordDiv = render.getByTestId(
    'import-srp__multi-srp__srp-word-0',
  );
  // This is safe because the input is always present in the word div.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstSrpWordInput = firstSrpWordDiv.querySelector('input')!;

  const pasteEvent = createEvent.paste(firstSrpWordInput, {
    clipboardData: {
      getData: () => srp,
    },
  });

  fireEvent(firstSrpWordInput, pasteEvent);

  return {
    word: firstWord,
    input: firstSrpWordInput,
  };
};

describe('ImportSrp', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should not show error messages until all words are provided', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { queryByText } = render;

    // Initially, no error message should be shown
    expect(
      queryByText('Word 1 is incorrect or misspelled.'),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Secret Recovery Phrases contain 12, or 24 words'),
    ).not.toBeInTheDocument();

    // Paste a partial SRP (first 6 words)
    const partialSrp = VALID_SECRET_RECOVERY_PHRASE.split(' ')
      .slice(0, 6)
      .join(' ');
    pasteSrpIntoFirstInput(render, partialSrp);

    // Still no error message should be shown
    expect(
      queryByText('Word 1 is incorrect or misspelled.'),
    ).not.toBeInTheDocument();
    expect(
      queryByText('Secret Recovery Phrases contain 12, or 24 words'),
    ).not.toBeInTheDocument();

    // Paste the complete SRP
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    // Now error messages should be shown if there are any issues
    await waitFor(() => {
      expect(
        queryByText('Word 1 is incorrect or misspelled.'),
      ).not.toBeInTheDocument();
      expect(
        queryByText('Secret Recovery Phrases contain 12, or 24 words'),
      ).not.toBeInTheDocument();
    });
  });

  it('enables the "Import wallet" button when a valid secret recovery phrase is entered', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;

    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);
    await waitFor(() => {
      expect(importButton).toBeEnabled();
    });
  });

  it('does not enable the "Import wallet" button when the secret recovery phrase is empty', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;

    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, '');
    expect(importButton).not.toBeEnabled();
  });

  it('shows 12 word seed phrase option', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText, getByTestId } = render;

    const twentyFourSeedWordOption = getByTestId(
      'import-srp__multi-srp__switch-word-count-button',
    );

    fireEvent.click(twentyFourSeedWordOption);

    await waitFor(async () => {
      expect(getByText('I have a 12 word recovery phrase'));
    });
  });

  it('calls importMnemonicToVault on successful import', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      const dispatchedActions = store.getActions();
      expect(dispatchedActions).toContainEqual({
        type: 'HIDE_WARNING',
      });
    });
  });

  it('locks and unlocks account syncing during import', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;
    const importButton = getByText('Import wallet');
    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);
    fireEvent.click(importButton);
    await waitFor(() => {
      expect(mockLockAccountSyncing).toHaveBeenCalled();
      expect(importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(mockUnlockAccountSyncing).toHaveBeenCalled();
    });
  });

  it('displays an error if one of the words in the srp is incorrect', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    const invalidSRP = VALID_SECRET_RECOVERY_PHRASE.replace('input', 'inptu');
    expect(importButton).not.toBeEnabled();

    const { input } = pasteSrpIntoFirstInput(render, invalidSRP);

    expect(input).toBeInvalid();
    expect(importButton).not.toBeEnabled();
  });

  it('clears the secret recovery phrase from clipboard after importing', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
    });

    expect(mockClearClipboard).toHaveBeenCalled();
  });

  it('clears the SRP input fields and error message when Clear button is clicked', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText, queryByTestId, getByTestId } = render;

    // Input an invalid SRP to trigger error
    const invalidSRP = VALID_SECRET_RECOVERY_PHRASE.replace('input', 'inptu');
    pasteSrpIntoFirstInput(render, invalidSRP);

    // Verify error message is shown
    const bannerAlert = await waitFor(() => getByTestId('bannerAlert'));
    expect(bannerAlert).toBeInTheDocument();

    // Click Clear button
    const clearButton = getByText('Clear');
    fireEvent.click(clearButton);

    // Verify error message is cleared
    expect(queryByTestId('bannerAlert')).not.toBeInTheDocument();

    // Verify all input fields are cleared
    for (let i = 0; i < 12; i++) {
      const input = getByTestId(
        `import-srp__multi-srp__srp-word-${i}`,
      ).querySelector('input');
      expect(input).toHaveValue('');
    }

    // Verify Import wallet button is disabled
    expect(getByText('Import wallet')).not.toBeEnabled();
  });

  it('logs an error and not call onActionComplete on import failure', async () => {
    (importMnemonicToVault as jest.Mock).mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const onActionComplete = jest.fn();
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });

  it('clears validation errors when switching to 24-word seed phrase mode', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText, getByTestId } = render;

    // First paste an invalid SRP to trigger validation errors
    const invalidSRP = VALID_SECRET_RECOVERY_PHRASE.replace('input', 'inptu');
    pasteSrpIntoFirstInput(render, invalidSRP);

    // Verify that validation errors are present
    const firstInput = getByTestId(
      'import-srp__multi-srp__srp-word-0',
    ).querySelector('input');
    expect(firstInput).toBeInvalid();

    // Click the "I have a 24 word seed phrase" button
    const switchTo24WordsButton = getByText('I have a 24 word recovery phrase');
    fireEvent.click(switchTo24WordsButton);

    // Verify that validation errors are cleared
    expect(firstInput).not.toBeInvalid();
  });

  it('does not enable submit if 24 word seed was selected and 12 word seed was entered', async () => {
    const render = renderWithProvider(<ImportSrp />, store);
    const { getByText, getByTestId } = render;

    const twentyFourSeedWordOption = getByTestId(
      'import-srp__multi-srp__switch-word-count-button',
    );

    fireEvent.click(twentyFourSeedWordOption);

    await waitFor(() => {
      expect(
        getByTestId('import-srp__multi-srp__srp-word-23').querySelector(
          'input',
        ),
      ).toBeInTheDocument();
    });

    for (const [index, word] of VALID_SECRET_RECOVERY_PHRASE.split(
      ' ',
    ).entries()) {
      // This is safe because the input is always present in the word div.
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const input = getByTestId(
        `import-srp__multi-srp__srp-word-${index}`,
      ).querySelector('input')!;
      fireEvent.change(input, { target: { value: word } });
    }

    expect(getByText('Import wallet')).not.toBeEnabled();
  });
});
