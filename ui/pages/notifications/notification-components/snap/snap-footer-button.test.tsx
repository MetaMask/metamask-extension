import React from 'react';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { fireEvent, waitFor } from '@testing-library/react';
import { createMockSnapNotification } from '@metamask/notification-services-controller/notification-services/mocks';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SnapFooterButton } from './snap-footer-button';
import { DetailedViewData, SnapNotification } from './types';

const mockUseNavigate = jest.fn();

jest.mock('react-router-dom-v5-compat', () => {
  return {
    ...jest.requireActual('react-router-dom-v5-compat'),
    useNavigate: () => mockUseNavigate,
  };
});

// Type Util for testing

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

describe('SnapFooterButton', () => {
  const arrangeMocks = () => {
    const notification = processNotification(
      createMockSnapNotification(),
    ) as SnapNotification;

    return {
      notification,
    };
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing if there is no footer', () => {
    const { notification } = arrangeMocks();
    delete (notification.data as MockVar).detailedView;

    const { container } = renderWithProvider(
      <SnapFooterButton notification={notification} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the NotificationDetailButton and navigates to home page when clicked', () => {
    const { notification } = arrangeMocks();
    (notification.data as DetailedViewData).detailedView.footerLink = {
      text: 'Go Home',
      href: 'metamask://client/',
    };

    const { getByText } = renderWithProvider(
      <SnapFooterButton notification={notification} />,
    );
    const button = getByText('Go Home');
    expect(button).toBeInTheDocument();
    fireEvent.click(button);
    expect(mockUseNavigate).toHaveBeenCalledWith('/');
  });

  it('opens SnapLinkWarning when external link is clicked', async () => {
    const { notification } = arrangeMocks();
    (notification.data as DetailedViewData).detailedView.footerLink = {
      text: 'Go External',
      href: 'https://www.foo.bar',
    };

    const { getByText } = renderWithProvider(
      <SnapFooterButton notification={notification} />,
    );

    // Click Button
    const button = getByText('Go External');
    fireEvent.click(button);

    // Confirm Leave
    await waitFor(() => {
      const leaveModalTitle = getByText('[leaveMetaMask]');
      const leaveModalButton = getByText('[visitSite]');
      expect(leaveModalTitle).toBeInTheDocument();
      expect(leaveModalButton).toBeInTheDocument();
    });
  });
});
