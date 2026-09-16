import { it as jestIt } from '@jest/globals';
import React from 'react';
import { Link } from 'react-router-dom';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import {
  PRIVACY_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../../helpers/constants/routes';
import mockState from '../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { acknowledgeBasicFunctionalityMigration } from '../../../store/actions';
import { BasicFunctionalityMigrationModal } from './basic-functionality-migration-modal';
import {
  BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK,
  BASIC_FUNCTIONALITY_MIGRATION_PRIVACY_NOTICE_LINK,
} from './constants';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  acknowledgeBasicFunctionalityMigration: jest.fn(() => jest.fn()),
}));

const mockStore = configureMockStore([thunk]);

function renderComponent({
  notification = 'modal',
  dismissed = false,
  pathname = '/',
  isUnlocked = true,
  completedOnboarding = true,
}: {
  notification?: 'modal' | 'toast' | null;
  dismissed?: boolean;
  pathname?: string;
  isUnlocked?: boolean;
  completedOnboarding?: boolean;
} = {}) {
  const store = mockStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      isUnlocked,
      completedOnboarding,
      authConnection: 'google',
      remoteFeatureFlags: {
        ...mockState.metamask.remoteFeatureFlags,
        extensionBasicFunctionalityToggle: true,
      },
      preferences: {
        ...mockState.metamask.preferences,
        basicFunctionalityMigrationNotification: notification,
        basicFunctionalityMigrationNotificationDismissed: dismissed,
      },
    },
  });

  return renderWithProvider(
    <>
      <Link to="/">Home</Link>
      <BasicFunctionalityMigrationModal />
    </>,
    store,
    pathname,
  );
}

describe('BasicFunctionalityMigrationModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the social-login privacy notice when scheduled', () => {
    const { getByTestId, getByText, getByRole, queryByLabelText } =
      renderComponent();

    expect(
      getByTestId('basic-functionality-migration-modal'),
    ).toBeInTheDocument();
    expect(
      getByText(messages.basicFunctionalityMigrationSocialModalTitle.message),
    ).toBeInTheDocument();
    expect(
      getByText(messages.basicFunctionalityMigrationSocialModalBody1.message),
    ).toBeInTheDocument();
    expect(queryByLabelText(messages.close.message)).not.toBeInTheDocument();
    expect(
      getByRole('link', {
        name: messages.basicFunctionalityMigrationSocialModalBlogPostLink
          .message,
      }),
    ).toHaveAttribute('href', BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK);
    expect(
      getByRole('link', {
        name: messages.basicFunctionalityMigrationSocialModalPrivacyNoticeLink
          .message,
      }),
    ).toHaveAttribute(
      'href',
      BASIC_FUNCTIONALITY_MIGRATION_PRIVACY_NOTICE_LINK,
    );
  });

  it('does not render when the notification is not modal', () => {
    const { queryByTestId } = renderComponent({ notification: null });

    expect(
      queryByTestId('basic-functionality-migration-modal'),
    ).not.toBeInTheDocument();
  });

  it('does not render after the notice has been dismissed', () => {
    const { queryByTestId } = renderComponent({
      notification: 'modal',
      dismissed: true,
    });

    expect(
      queryByTestId('basic-functionality-migration-modal'),
    ).not.toBeInTheDocument();
  });

  it('acknowledges only when Acknowledge is clicked', () => {
    const { getByTestId } = renderComponent();

    expect(
      getByTestId('basic-functionality-migration-modal-accept'),
    ).toHaveTextContent('Acknowledge');
    fireEvent.click(getByTestId('basic-functionality-migration-modal-accept'));

    expect(acknowledgeBasicFunctionalityMigration).toHaveBeenCalled();
  });

  jestIt.each([
    { pathname: PRIVACY_ROUTE },
    { pathname: `${PRIVACY_ROUTE}/` },
    { pathname: ONBOARDING_COMPLETION_ROUTE },
    { isUnlocked: false },
    { completedOnboarding: false },
  ])('does not block an exempt page or wallet state: %j', (options) => {
    const { queryByTestId } = renderComponent(options);
    expect(
      queryByTestId('basic-functionality-migration-modal'),
    ).not.toBeInTheDocument();
  });

  jestIt.each([
    '/settings',
    '/settings/security',
    '/confirm-transaction',
    '/send',
  ])('shows on the unlocked %s page', (pathname) => {
    const { getByTestId } = renderComponent({ pathname });
    expect(
      getByTestId('basic-functionality-migration-modal'),
    ).toBeInTheDocument();
  });

  it('returns after visiting privacy settings without acknowledgment', () => {
    const { getByRole, queryByTestId, getByTestId } = renderComponent();
    fireEvent.click(
      getByRole('link', {
        name: messages.basicFunctionalityMigrationToastSettingsLink.message,
      }),
    );
    expect(
      queryByTestId('basic-functionality-migration-modal'),
    ).not.toBeInTheDocument();
    expect(acknowledgeBasicFunctionalityMigration).not.toHaveBeenCalled();

    fireEvent.click(getByRole('link', { name: 'Home' }));
    expect(
      getByTestId('basic-functionality-migration-modal'),
    ).toBeInTheDocument();
  });

  it('does not dismiss on Escape', () => {
    renderComponent();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(acknowledgeBasicFunctionalityMigration).not.toHaveBeenCalled();
  });
});
