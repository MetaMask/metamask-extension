import React from 'react';
import { processNotification } from '@metamask/notification-services-controller/notification-services';
import { fireEvent, waitFor } from '@testing-library/react';
import { createMockSnapNotification } from '@metamask/notification-services-controller/notification-services/mocks';
import * as SnapNavigation from '../../../../hooks/snaps/useSnapNavigation';
import { renderWithProvider } from '../../../../../test/lib/render-helpers';
import { SnapFooterButton } from './snap-footer-button';
import { DetailedViewData, SnapNotification } from './types';

// Type Util for testing

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type MockVar = any;

describe('SnapFooterButton', () => {
  const arrangeMocks = () => {
    const mockNavigate = jest.fn();
    const mockUseSnapNavigation = jest
      .spyOn(SnapNavigation, 'default')
      .mockReturnValue({ navigate: mockNavigate });
    const notification = processNotification(
      createMockSnapNotification(),
    ) as SnapNotification;

    return {
      mockNavigate,
      mockUseSnapNavigation,
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

  it('renders the NotificationDetailButton', () => {
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
  });

  it('navigates when internal link is clicked', () => {
    const { notification, mockNavigate } = arrangeMocks();
    (notification.data as DetailedViewData).detailedView.footerLink = {
      text: 'Go Home',
      href: 'metamask://client/',
    };

    const { getByText } = renderWithProvider(
      <SnapFooterButton notification={notification} />,
    );
    const button = getByText('Go Home');
    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('metamask://client/');
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
