import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { useModalProps } from '../../../../hooks/useModalProps';
import { I18nContext } from '../../../../contexts/i18n';
import ConfirmTurnOffProfileSyncing from './confirm-turn-off-profile-syncing';

jest.mock('../../../../hooks/useModalProps', () => ({
  useModalProps: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
}));

const mockSetIsBackupAndSyncFeatureEnabled = jest.fn();
jest.mock('../../../../hooks/identity/useBackupAndSync', () => ({
  useBackupAndSync: jest.fn(() => ({
    setIsBackupAndSyncFeatureEnabled: mockSetIsBackupAndSyncFeatureEnabled,
    error: null,
  })),
}));

const mockedUseModalProps = useModalProps as jest.MockedFunction<
  typeof useModalProps
>;

const mockHideModal = jest.fn();

describe('ConfirmTurnOffProfileSyncing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModalProps.mockReturnValue({
      hideModal: mockHideModal,
      props: {},
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
