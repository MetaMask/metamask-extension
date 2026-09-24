import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import {
  ENVIRONMENT_TYPE_FULLSCREEN,
  ENVIRONMENT_TYPE_NOTIFICATION,
  ENVIRONMENT_TYPE_POPUP,
} from '../../../../shared/constants/app';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { BasicFunctionalityMigrationToast } from './basic-functionality-migration-toast';
import {
  BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
  BasicFunctionalityMixedToastAction,
} from './constants';

const mockNavigate = jest.fn();
const mockGetEnvironmentType = jest.fn(() => ENVIRONMENT_TYPE_FULLSCREEN);
const mockOpenExtensionInBrowser = jest.fn();
const mockTrackEvent = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../../shared/lib/environment-type', () => ({
  getEnvironmentType: () => mockGetEnvironmentType(),
}));

jest.mock('../../../hooks/useAnalytics', () => {
  const { createEventBuilder } = jest.requireActual(
    '../../../../shared/lib/analytics/create-event-builder',
  );

  return {
    useAnalytics: () => ({
      trackEvent: mockTrackEvent,
      createEventBuilder,
    }),
  };
});

const mockHideMigrationToast = jest.fn(() => () => Promise.resolve());

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideMigrationToast: () => mockHideMigrationToast(),
}));

const mockStore = configureMockStore([thunk]);

function renderComponent({
  isBasicFunctionalityEnabled = true,
  notification = 'toast',
}: {
  isBasicFunctionalityEnabled?: boolean;
  notification?: 'modal' | 'toast' | null;
} = {}) {
  const store = mockStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      useExternalServices: isBasicFunctionalityEnabled,
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        extensionBasicFunctionalityToggle: true,
      },
      preferences: {
        ...mockState.metamask.preferences,
        basicFunctionalityMigrationNotification: notification,
        basicFunctionalityMigrationNotificationDismissed: false,
      },
    },
  });

  return renderWithProvider(<BasicFunctionalityMigrationToast />, store);
}

describe('BasicFunctionalityMigrationToast', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_FULLSCREEN);
    globalThis.platform = {
      openExtensionInBrowser: mockOpenExtensionInBrowser,
    } as never;
  });

  it('shows the enabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: true,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent("It's turned on based on your previous settings.");
  });

  it('shows the disabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: false,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent("It's turned off based on your previous settings.");
  });

  it('does not render when no toast is scheduled', () => {
    const { queryByTestId } = renderComponent({ notification: null });

    expect(
      queryByTestId('basic-functionality-migration-toast'),
    ).not.toBeInTheDocument();
  });

  it('does not render while the wallet is locked', () => {
    const store = mockStore({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        isUnlocked: false,
        preferences: {
          ...mockState.metamask.preferences,
          basicFunctionalityMigrationNotification: 'toast',
          basicFunctionalityMigrationNotificationDismissed: false,
        },
      },
    });

    const { queryByTestId } = renderWithProvider(
      <BasicFunctionalityMigrationToast />,
      store,
    );

    expect(
      queryByTestId('basic-functionality-migration-toast'),
    ).not.toBeInTheDocument();
  });

  it('tracks viewed when the toast is shown', () => {
    renderComponent();

    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.Viewed,
        }),
      }),
    );
  });

  it('dismisses and navigates to privacy settings in fullscreen', async () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    await waitFor(() => {
      expect(mockHideMigrationToast).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockOpenExtensionInBrowser).not.toHaveBeenCalled();
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.OpenSettings,
        }),
      }),
    );
  });

  it('opens privacy settings in the full extension UI from notification', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_NOTIFICATION);
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    await waitFor(() => {
      expect(mockHideMigrationToast).toHaveBeenCalled();
    });
    expect(mockOpenExtensionInBrowser).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('navigates to privacy settings in-app from popup', async () => {
    mockGetEnvironmentType.mockReturnValue(ENVIRONMENT_TYPE_POPUP);
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    await waitFor(() => {
      expect(mockHideMigrationToast).toHaveBeenCalled();
    });
    expect(mockNavigate).toHaveBeenCalledWith(PRIVACY_ROUTE);
    expect(mockOpenExtensionInBrowser).not.toHaveBeenCalled();
  });

  it('waits to navigate until the migration toast is dismissed', async () => {
    let resolveHideMigrationToast: (() => void) | undefined;
    mockHideMigrationToast.mockImplementationOnce(
      () => () =>
        new Promise<void>((resolve) => {
          resolveHideMigrationToast = resolve;
        }),
    );

    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    expect(mockNavigate).not.toHaveBeenCalled();
    resolveHideMigrationToast?.();

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(PRIVACY_ROUTE);
    });
  });

  it('dismisses from the close button', async () => {
    const { getByRole } = renderComponent();

    fireEvent.click(
      getByRole('button', {
        name: messages.close.message,
      }),
    );

    await waitFor(() => {
      expect(mockHideMigrationToast).toHaveBeenCalled();
    });
    expect(mockTrackEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        name: MetaMetricsEventName.NoticeUpdateDisplayed,
        properties: expect.objectContaining({
          name: BASIC_FUNCTIONALITY_MIXED_TOAST_NOTICE_NAME,
          action: BasicFunctionalityMixedToastAction.Dismiss,
        }),
      }),
    );
  });
});
