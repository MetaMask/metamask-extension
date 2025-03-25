import React from 'react';
import {
  createEvent,
  fireEvent,
  RenderResult,
  waitFor,
} from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import * as actions from '../../../../store/actions';
import { ImportSrp } from './import-srp';

const mockClearClipboard = jest.fn();

jest.mock('../../../../helpers/utils/util', () => ({
  clearClipboard: () => mockClearClipboard(),
}));

const VALID_SECRET_RECOVERY_PHRASE =
  'input turtle oil scorpion exile useless dry foster vessel knee area label';

jest.mock('../../../../store/actions', () => ({
  importMnemonicToVault: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(null)),
  showAlert: jest.fn().mockReturnValue({ type: 'ALERT_OPEN' }),
  hideAlert: jest.fn().mockReturnValue({ type: 'ALERT_CLOSE' }),
}));

const pasteSrpIntoFirstInput = (render: RenderResult, srp: string) => {
  const [firstWord] = srp.split(' ');

  const firstSrpWordDiv = render.getByTestId('import-multi-srp__srp-word-0');
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

  it('enables the "Import wallet" button when a valid secret recovery phrase is entered', async () => {
    const render = renderWithProvider(
      <ImportSrp onActionComplete={jest.fn()} />,
      store,
    );
    const { getByText } = render;

    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);
    await waitFor(() => {
      expect(importButton).toBeEnabled();
    });
  });

  it('does not enable the "Import wallet" button when the secret recovery phrase is empty', async () => {
    const render = renderWithProvider(
      <ImportSrp onActionComplete={jest.fn()} />,
      store,
    );
    const { getByText } = render;

    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, '');
    expect(importButton).not.toBeEnabled();
  });

  it('calls addNewMnemonicToVault and showAlert on successful import', async () => {
    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSrp onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(actions.importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      const dispatchedActions = store.getActions();
      expect(dispatchedActions[0]).toStrictEqual({
        type: 'SET_SHOW_NEW_SRP_ADDED_TOAST',
        payload: true,
      });
      expect(onActionComplete).toHaveBeenCalledWith(true);
    });
  });

  it('displays an error if one of the words in the srp is incorrect', async () => {
    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSrp onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    const invalidSRP = VALID_SECRET_RECOVERY_PHRASE.replace('input', 'inptu');
    expect(importButton).not.toBeEnabled();

    const { input } = pasteSrpIntoFirstInput(render, invalidSRP);

    expect(input).toBeInvalid();
    expect(importButton).not.toBeEnabled();
  });

  it('clears the secret recovery phrase from clipboard after importing', async () => {
    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSrp onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(actions.importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(onActionComplete).toHaveBeenCalledWith(true);
    });

    expect(mockClearClipboard).toHaveBeenCalled();
  });

  it('logs an error and not call onActionComplete on import failure', async () => {
    (actions.importMnemonicToVault as jest.Mock).mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSrp onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;
    const importButton = getByText('Import wallet');

    expect(importButton).not.toBeEnabled();
    pasteSrpIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(importButton);

    await waitFor(() => {
      expect(actions.importMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });
});
