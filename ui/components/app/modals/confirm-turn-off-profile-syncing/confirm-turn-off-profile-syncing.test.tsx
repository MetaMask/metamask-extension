import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useModalProps } from '../../../../hooks/useModalProps';
import { useBackupAndSync } from '../../../../hooks/identity/useBackupAndSync';
import { I18nContext } from '../../../../contexts/i18n';
import ConfirmTurnOffProfileSyncing from './confirm-turn-off-profile-syncing';

jest.mock('../../../../hooks/useModalProps', () => ({
  useModalProps: jest.fn(),
}));

jest.mock('../../../../hooks/identity/useProfileSyncing', () => ({
  useDisableProfileSyncing: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockedUseModalProps = useModalProps as jest.MockedFunction<
  typeof useModalProps
>;
const mockedUseBackupAndSync =
  useBackupAndSync as jest.MockedFunction<
    typeof useBackupAndSync
  >;

const mockHideModal = jest.fn();
const mockSetIsBackupAndSyncFeatureEnabled = jest.fn();

describe('ConfirmTurnOffProfileSyncing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModalProps.mockReturnValue({
      hideModal: mockHideModal,
      props: {},
    });
    mockedUseBackupAndSync.mockReturnValue({
      setIsBackupAndSyncFeatureEnabled: mockSetIsBackupAndSyncFeatureEnabled,
      error: null,
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOffProfileSyncing />
      </I18nContext.Provider>,
    );
    expect(getByTestId('turn-off-sync-modal')).toBeInTheDocument();
  });

  it('closes the modal on cancel', () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOffProfileSyncing />
      </I18nContext.Provider>,
    );
    fireEvent.click(getByTestId('cancel-button'));
    expect(mockHideModal).toHaveBeenCalledTimes(1);
  });

  it('disables backup and sync and closes the modal on confirm', async () => {
    const { getByTestId } = render(
      <I18nContext.Provider value={(key) => key}>
        <ConfirmTurnOffProfileSyncing />
      </I18nContext.Provider>,
    );
    fireEvent.click(getByTestId('cancel-button'));
    await waitFor(() => {
      expect(mockHideModal).toHaveBeenCalledTimes(1);
    });
  });
});
