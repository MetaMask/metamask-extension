import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useModalProps } from '../../../../../hooks/useModalProps';
import { I18nContext } from '../../../../../contexts/i18n';
import { onboardingToggleBasicFunctionalityOn } from '../../../../../ducks/app/app';
import {
  ConfirmTurnOnBackupAndSyncModal,
  confirmTurnOnBackupAndSyncModalTestIds,
} from './confirm-turn-on-backup-and-sync-modal';

jest.mock('../../../../../hooks/useModalProps', () => ({
  useModalProps: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockedUseModalProps = useModalProps as jest.MockedFunction<
  typeof useModalProps
>;

const mockHideModal = jest.fn();
const mockEnableBackupAndSync = jest.fn();

describe('ConfirmTurnOnBackupAndSyncModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModalProps.mockReturnValue({
      hideModal: mockHideModal,
      props: {
        enableBackupAndSync: mockEnableBackupAndSync,
      },
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOnBackupAndSyncModal />
      </I18nContext.Provider>,
    );
    expect(
      getByTestId(confirmTurnOnBackupAndSyncModalTestIds.modal),
    ).toBeInTheDocument();
  });

  it('closes the modal on cancel', () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOnBackupAndSyncModal />
      </I18nContext.Provider>,
    );
    fireEvent.click(
      getByTestId(confirmTurnOnBackupAndSyncModalTestIds.cancelButton),
    );
    expect(mockHideModal).toHaveBeenCalledTimes(1);
  });

  it('calls the enableBackupAndSync callback from props', async () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOnBackupAndSyncModal />
      </I18nContext.Provider>,
    );
    fireEvent.click(
      getByTestId(confirmTurnOnBackupAndSyncModalTestIds.toggleButton),
    );
    await waitFor(() => {
      expect(mockHideModal).toHaveBeenCalledTimes(1);
      expect(mockEnableBackupAndSync).toHaveBeenCalledTimes(1);
    });
  });

  it('enables basic functionality', async () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOnBackupAndSyncModal />
      </I18nContext.Provider>,
    );
    fireEvent.click(
      getByTestId(confirmTurnOnBackupAndSyncModalTestIds.toggleButton),
    );
    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        onboardingToggleBasicFunctionalityOn(),
      );
      expect(mockDispatch).toHaveBeenCalledTimes(2);
    });
  });
});
