import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import {
  en as messages,
  renderWithProvider,
} from '../../../../test/lib/render-helpers-navigate';
import { hideMigrationModal } from '../../../store/actions';
import { BasicFunctionalityMigrationModal } from './basic-functionality-migration-modal';
import {
  BASIC_FUNCTIONALITY_MIGRATION_BLOG_POST_LINK,
  BASIC_FUNCTIONALITY_MIGRATION_PRIVACY_NOTICE_LINK,
} from './constants';

jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  hideMigrationModal: jest.fn(() => jest.fn()),
}));

const mockStore = configureMockStore([thunk]);

function renderComponent({
  notification = 'modal',
  dismissed = false,
}: {
  notification?: 'modal' | 'toast' | null;
  dismissed?: boolean;
} = {}) {
  const store = mockStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
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

  return renderWithProvider(<BasicFunctionalityMigrationModal />, store);
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

  it('dismisses when Accept and close is clicked', () => {
    const { getByTestId } = renderComponent();

    fireEvent.click(getByTestId('basic-functionality-migration-modal-accept'));

    expect(hideMigrationModal).toHaveBeenCalled();
  });

  it('does not dismiss on Escape', () => {
    renderComponent();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(hideMigrationModal).not.toHaveBeenCalled();
  });
});
