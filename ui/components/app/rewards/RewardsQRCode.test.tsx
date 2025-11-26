import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useSelector, useDispatch } from 'react-redux';
import { setOnboardingModalOpen } from '../../../ducks/rewards';
import { getSocialLoginType } from '../../../selectors/seedless-onboarding/social-sync';
import RewardsQRCode from './RewardsQRCode';
import {
  GOOGLE_ONBOARDING_URL,
  SRP_ONBOARDING_URL,
  APPLE_ONBOARDING_URL,
} from './utils/constants';

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
    if (key === 'gotIt') {
      return 'Got it';
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
      if (selector === getSocialLoginType) {
        return undefined;
      }
      return undefined;
    });

    render(<RewardsQRCode />);

    expect(
      screen.getByTestId('rewards-onboarding-qrcode-container'),
    ).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toBeInTheDocument();
    expect(mockUseSelector).toHaveBeenCalledWith(getSocialLoginType);
  });

  it('encodes Google socialType in QR data when provided', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSocialLoginType) {
        return 'google';
      }
      return undefined;
    });

    render(<RewardsQRCode />);

    const qrImageContainer = screen.getByTestId('qr-code-image');
    expect(qrImageContainer).toBeInTheDocument();
    // The inner HTML is produced by our qr generator mock and includes data-qr
    // InnerHTML encodes ampersands, so compare against encoded version
    const encoded = GOOGLE_ONBOARDING_URL.replaceAll('&', '&amp;');
    expect(qrImageContainer.innerHTML).toContain(`data-qr="${encoded}"`);
  });

  it('encodes Apple socialType in QR data when provided', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSocialLoginType) {
        return 'apple';
      }
      return undefined;
    });

    render(<RewardsQRCode />);

    const qrImageContainer = screen.getByTestId('qr-code-image');
    expect(qrImageContainer).toBeInTheDocument();
    const encoded = APPLE_ONBOARDING_URL.replaceAll('&', '&amp;');
    expect(qrImageContainer.innerHTML).toContain(`data-qr="${encoded}"`);
  });

  it('defaults to SRP flow in QR data when socialType is absent', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSocialLoginType) {
        return undefined;
      }
      return undefined;
    });

    render(<RewardsQRCode />);

    const qrImageContainer = screen.getByTestId('qr-code-image');
    expect(qrImageContainer).toBeInTheDocument();
    const encoded = SRP_ONBOARDING_URL.replaceAll('&', '&amp;');
    expect(qrImageContainer.innerHTML).toContain(`data-qr="${encoded}"`);
  });

  it('dispatches close action when clicking Got it', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getSocialLoginType) {
        return undefined;
      }
      return undefined;
    });
    const dispatchMock = jest.fn();
    mockUseDispatch.mockReturnValue(dispatchMock);

    render(<RewardsQRCode />);

    const closeButton = screen.getByRole('button', { name: 'Got it' });
    expect(closeButton).toBeInTheDocument();
    fireEvent.click(closeButton);

    expect(dispatchMock).toHaveBeenCalledWith(setOnboardingModalOpen(false));
  });
});
