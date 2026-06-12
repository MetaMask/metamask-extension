import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  setRewardsModalOpen,
  setOnboardingReferralCode,
  setRewardsDeeplinkUrl,
} from '../../../ducks/rewards';
import { selectRewardsDeeplinkUrl } from '../../../ducks/rewards/selectors';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import RewardsQRCode from './RewardsQRCode';
import { REWARDS_DEEPLINK_BASE_URL } from './utils/constants';

// Mock react-redux hooks
jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  useDispatch: jest.fn(() => jest.fn()),
}));

// Mock i18n to return readable strings
jest.mock('../../../hooks/useI18nContext', () => ({
  useI18nContext: jest.fn(() => (key: string) => {
    if (key === 'rewardsQRCodeTitle') {
      return 'Scan this QR code to continue';
    }
    if (key === 'rewardsQRCodeDescription') {
      return 'Use your mobile app to complete onboarding.';
    }
    if (key === 'done') {
      return 'Done';
    }
    return key;
  }),
}));

// Mock ModalBody to a simple container preserving test id and children
jest.mock('../../component-library/modal-body/modal-body', () => ({
  ModalBody: ({
    children,
    ...props
  }: React.PropsWithChildren<React.HTMLAttributes<HTMLDivElement>>) => (
    <div {...props}>{children}</div>
  ),
}));

// Mock QR code generator to expose the encoded data in the DOM
// so we can assert the component passes the correct value
jest.mock('qrcode-generator', () => {
  return jest.fn(() => {
    let storedData = '';
    return {
      addData: (data: string) => {
        storedData = data;
      },
      make: jest.fn(),
      createTableTag: jest.fn(() => `<div data-qr="${storedData}">QR</div>`),
    };
  });
});

const mockUseSelector = useSelector as jest.MockedFunction<typeof useSelector>;
const mockUseDispatch = useDispatch as jest.MockedFunction<typeof useDispatch>;

describe('RewardsQRCode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the container and logo image', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectRewardsDeeplinkUrl) {
        return null;
      }
      return null;
    });

    render(<RewardsQRCode />);

    expect(
      screen.getByTestId('rewards-onboarding-qrcode-container'),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(mockUseSelector).toHaveBeenCalledWith(selectRewardsDeeplinkUrl);
  });

  it('encodes the stored deeplink URL in the QR code when present', () => {
    const deeplink = 'https://link.metamask.io/rewards?referral=ABC123';
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectRewardsDeeplinkUrl) {
        return deeplink;
      }
      return null;
    });

    render(<RewardsQRCode />);

    const qrImageContainer = screen.getByTestId('qr-code-image');
    expect(qrImageContainer.innerHTML).toContain(`data-qr="${deeplink}"`);
  });

  it('falls back to REWARDS_DEEPLINK_BASE_URL when no deeplink is stored', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectRewardsDeeplinkUrl) {
        return null;
      }
      return null;
    });

    render(<RewardsQRCode />);

    const qrImageContainer = screen.getByTestId('qr-code-image');
    expect(qrImageContainer.innerHTML).toContain(
      `data-qr="${REWARDS_DEEPLINK_BASE_URL}"`,
    );
  });

  it('dispatches close action when clicking Done', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === selectRewardsDeeplinkUrl) {
        return null;
      }
      return null;
    });
    const dispatchMock = jest.fn();
    mockUseDispatch.mockReturnValue(dispatchMock);

    render(<RewardsQRCode />);

    const closeButton = screen.getByRole('button', {
      name: messages.done.message,
    });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(dispatchMock).toHaveBeenCalledWith(setRewardsModalOpen(false));
    expect(dispatchMock).toHaveBeenCalledWith(setOnboardingReferralCode(null));
    expect(dispatchMock).toHaveBeenCalledWith(setRewardsDeeplinkUrl(null));
  });
});
