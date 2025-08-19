import React from 'react';
import * as Redux from 'react-redux';
import { fireEvent, render, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import { BACKUPANDSYNC_FEATURES } from '@metamask/profile-sync-controller/user-storage';
import { useModalProps } from '../../../../../hooks/useModalProps';
import { MetamaskIdentityProvider } from '../../../../../contexts/identity';
import { showModal } from '../../../../../store/actions';
import { CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME } from '../confirm-turn-on-backup-and-sync-modal';
import { BACKUPANDSYNC_ROUTE } from '../../../../../helpers/constants/routes';
import { MetaMetricsContext } from '../../../../../contexts/metametrics';
import {
  TurnOnBackupAndSyncModal,
  turnOnBackupAndSyncModalTestIds,
} from './turn-on-backup-and-sync-modal';

const mockTrackEvent = jest.fn();

jest.mock('../../../../../hooks/useModalProps', () => ({
  useModalProps: jest.fn(),
}));

const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

const mockHistoryPush = jest.fn();
jest.mock('react-router-dom', () => ({
  useHistory: () => ({
    push: mockHistoryPush,
  }),
}));

const mockSetIsBackupAndSyncFeatureEnabled = jest.fn();
jest.mock('../../../../../hooks/identity/useBackupAndSync', () => ({
  useBackupAndSync: () => ({
    setIsBackupAndSyncFeatureEnabled: mockSetIsBackupAndSyncFeatureEnabled,
    error: null,
  }),
}));

const mockStore = configureMockStore();
const initialStore = () => ({
  metamask: {
    isSignedIn: false,
    useExternalServices: true,
    isBackupAndSyncEnabled: true,
    participateInMetaMetrics: false,
    isBackupAndSyncUpdateLoading: false,
    keyrings: [],
  },
  appState: {
    externalServicesOnboardingToggleState: true,
  },
});

const mockedUseModalProps = useModalProps as jest.MockedFunction<
  typeof useModalProps
>;

const mockHideModal = jest.fn();

describe('TurnOnBackupAndSyncModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseModalProps.mockReturnValue({
      hideModal: mockHideModal,
      props: {},
    });
  });

  it('renders correctly', () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetamaskIdentityProvider>
          <TurnOnBackupAndSyncModal />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );
    expect(
      getByTestId(turnOnBackupAndSyncModalTestIds.modal),
    ).toBeInTheDocument();
  });

  it('sends a MetaMetrics event when the modal is dismissed', () => {
    const { getByLabelText } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
          <MetamaskIdentityProvider>
            <TurnOnBackupAndSyncModal />
          </MetamaskIdentityProvider>
        </MetaMetricsContext.Provider>
      </Redux.Provider>,
    );

    const closeButton = getByLabelText('[close]');
    fireEvent.click(closeButton);
    expect(mockHideModal).toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: 'Profile Activity Updated',
      category: 'Backup And Sync',
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_name: 'Backup And Sync Carousel Modal',
        action: 'Modal Dismissed',
      },
    });
  });

  it('shows the confirmation modal when the button is clicked if basic functionality is disabled', async () => {
    const store = initialStore();
    store.metamask.useExternalServices = false;

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <MetamaskIdentityProvider>
          <TurnOnBackupAndSyncModal />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );

    const button = getByTestId(turnOnBackupAndSyncModalTestIds.button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockDispatch).toHaveBeenCalledWith(
        showModal({
          name: CONFIRM_TURN_ON_BACKUP_AND_SYNC_MODAL_NAME,
          enableBackupAndSync: expect.any(Function),
        }),
      );
    });
  });

  it('calls setIsBackupAndSyncFeatureEnabled and pushes to history when the button is clicked if basic functionality is already enabled', async () => {
    const store = initialStore();
    store.metamask.isBackupAndSyncEnabled = false;
    store.metamask.useExternalServices = true;

    const { getByTestId } = render(
      <Redux.Provider store={mockStore(store)}>
        <MetamaskIdentityProvider>
          <TurnOnBackupAndSyncModal />
        </MetamaskIdentityProvider>
      </Redux.Provider>,
    );

    const button = getByTestId(turnOnBackupAndSyncModalTestIds.button);
    fireEvent.click(button);

    await waitFor(() => {
      expect(mockHistoryPush).toHaveBeenCalledWith(BACKUPANDSYNC_ROUTE);
      expect(mockSetIsBackupAndSyncFeatureEnabled).toHaveBeenCalledWith(
        BACKUPANDSYNC_FEATURES.main,
        true,
      );
      expect(mockHideModal).toHaveBeenCalled();
    });
  });

  it('sends a MetaMetrics event when the button is clicked', async () => {
    const { getByTestId } = render(
      <Redux.Provider store={mockStore(initialStore())}>
        <MetaMetricsContext.Provider value={{ trackEvent: mockTrackEvent }}>
          <MetamaskIdentityProvider>
            <TurnOnBackupAndSyncModal />
          </MetamaskIdentityProvider>
        </MetaMetricsContext.Provider>
      </Redux.Provider>,
    );

    const button = getByTestId(turnOnBackupAndSyncModalTestIds.button);
    fireEvent.click(button);

    expect(mockTrackEvent).toHaveBeenCalledWith({
      event: 'Profile Activity Updated',
      category: 'Backup And Sync',
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        feature_name: 'Backup And Sync Carousel Modal',
        action: 'Turned On',
      },
    });
  });
});
