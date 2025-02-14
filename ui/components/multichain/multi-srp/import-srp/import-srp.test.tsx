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
import { ImportSRP } from './import-srp';

const VALID_SECRET_RECOVERY_PHRASE =
  'input turtle oil scorpion exile useless dry foster vessel knee area label';

jest.mock('../../../../store/actions', () => ({
  addNewMnemonicToVault: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(null)),
  showAlert: jest.fn().mockReturnValue({ type: 'ALERT_OPEN' }),
  hideAlert: jest.fn().mockReturnValue({ type: 'ALERT_CLOSE' }),
}));

const pasteSRPIntoFirstInput = async (render: RenderResult, srp: string) => {
  const firstSRPWordDiv = render.getByTestId('import-srp__srp-word-0');
  // This is safe because the input is always present in the word div.
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const firstSRPWordInput = firstSRPWordDiv.querySelector('input')!;

  const pasteEvent = createEvent.paste(firstSRPWordInput, {
    clipboardData: {
      getData: () => srp,
    },
  });

  fireEvent(firstSRPWordInput, pasteEvent);
};

describe('ImportSRP', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should enable the "Import wallet" button when a valid secret recovery phrase is entered', async () => {
    const render = renderWithProvider(
      <ImportSRP onActionComplete={jest.fn()} />,
      store,
    );
    const { getByText } = render;

    expect(getByText('Import wallet')).not.toBeEnabled();
    await pasteSRPIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    await waitFor(() => {
      expect(getByText('Import wallet')).toBeEnabled();
    });
  });

  it('should not enable the "Import wallet" button when the secret recovery phrase is empty', async () => {
    const render = renderWithProvider(
      <ImportSRP onActionComplete={jest.fn()} />,
      store,
    );
    const { getByText } = render;

    expect(getByText('Import wallet')).not.toBeEnabled();
    await pasteSRPIntoFirstInput(render, '');
    expect(getByText('Import wallet')).not.toBeEnabled();
  });

  it('should call addNewMnemonicToVault and showAlert on successful import', async () => {
    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSRP onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;

    expect(getByText('Import wallet')).not.toBeEnabled();
    await pasteSRPIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(getByText('Import wallet'));

    await waitFor(() => {
      expect(actions.addNewMnemonicToVault).toHaveBeenCalledWith(
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

  it('should log an error and not call onActionComplete on import failure', async () => {
    (actions.addNewMnemonicToVault as jest.Mock).mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSRP onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText } = render;

    expect(getByText('Import wallet')).not.toBeEnabled();
    await pasteSRPIntoFirstInput(render, VALID_SECRET_RECOVERY_PHRASE);

    fireEvent.click(getByText('Import wallet'));

    await waitFor(() => {
      expect(actions.addNewMnemonicToVault).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });

  it('displays an error if one of the words in the srp is incorrect', async () => {
    const onActionComplete = jest.fn();
    const render = renderWithProvider(
      <ImportSRP onActionComplete={onActionComplete} />,
      store,
    );
    const { getByText, getByTestId } = render;

    const invalidSRP = VALID_SECRET_RECOVERY_PHRASE.replace('input', 'inptu');
    expect(getByText('Import wallet')).not.toBeEnabled();
    await pasteSRPIntoFirstInput(render, invalidSRP);

    // This is safe because the input is always present in the word div.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const invalidWord = getByTestId('import-srp__srp-word-0').querySelector(
      'input',
    )!;

    const importButton = getByText('Import wallet');

    expect(invalidWord).toBeInvalid();
    expect(importButton).toBeDisabled();
  });
});
