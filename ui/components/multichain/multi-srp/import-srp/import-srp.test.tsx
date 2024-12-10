import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../../test/jest/rendering';
import mockState from '../../../../../test/data/mock-state.json';
import * as actions from '../../../../store/actions';
import { ImportSRP } from './import-srp';

const VALID_SECRET_RECOVERY_PHRASE =
  'input turtle oil scorpion exile useless dry foster vessel knee area label';

jest.mock('../../../../store/actions', () => ({
  createNewVaultAndRestoreFromMnemonic: jest
    .fn()
    .mockReturnValue(jest.fn().mockResolvedValue(null)),
  showAlert: jest.fn().mockReturnValue({ type: 'ALERT_OPEN' }),
  hideAlert: jest.fn().mockReturnValue({ type: 'ALERT_CLOSE' }),
}));

describe('ImportSRP', () => {
  const store = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('should enable the "Import wallet" button when a valid secret recovery phrase is entered', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportSRP onActionComplete={jest.fn()} />,
      store,
    );
    expect(getByText('Import wallet')).not.toBeEnabled();
    const textarea = getByPlaceholderText('Recovery phrase');
    fireEvent.change(textarea, {
      target: {
        value: VALID_SECRET_RECOVERY_PHRASE,
      },
    });
    expect(getByText('Import wallet')).toBeEnabled();
  });

  it('should not enable the "Import wallet" button when the secret recovery phrase is empty', () => {
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportSRP onActionComplete={jest.fn()} />,
      store,
    );
    expect(getByText('Import wallet')).not.toBeEnabled();
    const textarea = getByPlaceholderText('Recovery phrase');
    fireEvent.change(textarea, {
      target: { value: '' },
    });
    expect(getByText('Import wallet')).not.toBeEnabled();
  });

  it('should call createNewVaultAndRestoreFromMnemonic and showAlert on successful import', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportSRP onActionComplete={onActionComplete} />,
      store,
    );
    const textarea = getByPlaceholderText('Recovery phrase');
    fireEvent.change(textarea, {
      target: {
        value: VALID_SECRET_RECOVERY_PHRASE,
      },
    });

    fireEvent.click(getByText('Import wallet'));

    await waitFor(() => {
      expect(actions.createNewVaultAndRestoreFromMnemonic).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(actions.showAlert).toHaveBeenCalledWith(
        'Wallet successfully imported',
      );
      expect(onActionComplete).toHaveBeenCalledWith(true);
    });
  });

  it('should log an error and not call onActionComplete on import failure', async () => {
    (actions.createNewVaultAndRestoreFromMnemonic as jest.Mock).mockImplementation(() =>
      jest.fn().mockRejectedValue(new Error('error')),
    );

    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = renderWithProvider(
      <ImportSRP onActionComplete={onActionComplete} />,
      store,
    );
    const textarea = getByPlaceholderText('Recovery phrase');
    fireEvent.change(textarea, {
      target: {
        value: VALID_SECRET_RECOVERY_PHRASE,
      },
    });

    fireEvent.click(getByText('Import wallet'));

    await waitFor(() => {
      expect(actions.createNewVaultAndRestoreFromMnemonic).toHaveBeenCalledWith(
        VALID_SECRET_RECOVERY_PHRASE,
      );
      expect(onActionComplete).not.toHaveBeenCalled();
    });
  });
});
