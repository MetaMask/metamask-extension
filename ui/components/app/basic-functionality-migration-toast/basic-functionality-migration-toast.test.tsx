import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { PRIVACY_ROUTE } from '../../../helpers/constants/routes';
import { hideMigrationToast } from '../../../store/actions';
import { BasicFunctionalityMigrationToast } from './basic-functionality-migration-toast';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideMigrationToast: jest.fn(() => jest.fn()),
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
  });

  it('shows the enabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: true,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent('this setting is enabled.');
  });

  it('shows the disabled Basic Functionality state', () => {
    const { getByTestId } = renderComponent({
      isBasicFunctionalityEnabled: false,
    });

    expect(
      getByTestId('basic-functionality-migration-toast'),
    ).toHaveTextContent('this setting is disabled.');
  });

  it('does not render when no toast is scheduled', () => {
    const { queryByTestId } = renderComponent({ notification: null });

    expect(
      queryByTestId('basic-functionality-migration-toast'),
    ).not.toBeInTheDocument();
  });

  it('dismisses and opens privacy settings from the inline link', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-settings-link'));

    expect(hideMigrationToast).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(PRIVACY_ROUTE);
  });

  it('dismisses from the close button', () => {
    const { getByRole } = renderComponent();

    fireEvent.click(
      getByRole('button', {
        name: messages.close.message,
      }),
    );

    expect(hideMigrationToast).toHaveBeenCalled();
  });
});
