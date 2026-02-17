/**
 * @jest-environment jsdom
 */
///: BEGIN:ONLY_INCLUDE_IF(musd-conversion)
import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import configureStore from '../../../store/store';
import MusdEducationScreen from './education';

// Mock useMusdConversion hook
const mockStartConversionFlow = jest.fn().mockResolvedValue(undefined);
jest.mock('../../../hooks/musd', () => ({
  useMusdConversion: () => ({
    startConversionFlow: mockStartConversionFlow,
    educationSeen: false,
  }),
  useMusdGeoBlocking: () => ({
    isBlocked: false,
    userCountry: 'US',
    isLoading: false,
  }),
}));

// Mock Redux dispatch
const mockDispatch = jest.fn();
jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useDispatch: () => mockDispatch,
}));

// Mock navigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const createMockStore = () => {
  return configureStore({
    metamask: {
      remoteFeatureFlags: {
        earnMusdConversionFlowEnabled: true,
      },
      selectedNetworkClientId: 'mainnet',
      networkConfigurationsByChainId: {
        '0x1': { chainId: '0x1', name: 'Ethereum Mainnet' },
      },
      internalAccounts: {
        selectedAccount: 'account-1',
        accounts: {
          'account-1': { id: 'account-1', address: '0x123' },
        },
      },
    },
    musd: {
      educationSeen: false,
      dismissedCtaKeys: [],
    },
  });
};

describe('MusdEducationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the headline with the bonus percentage', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    expect(screen.getByText('GET 3% ON STABLECOINS')).toBeInTheDocument();
  });

  it('renders the body copy', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    expect(
      screen.getByText(/Convert your stablecoins to mUSD/u),
    ).toBeInTheDocument();
  });

  it('renders the illustration image', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const img = screen.getByRole('img');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', './images/musd-education-coin.png');
  });

  it('renders the "Get started" primary button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-continue-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Get started');
  });

  it('renders the "Not now" secondary button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-not-now-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveTextContent('Not now');
  });

  it('renders the close icon button', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const closeButton = screen.getByTestId('musd-education-skip-button');
    expect(closeButton).toBeInTheDocument();
  });

  it('dispatches setEducationSeen and starts conversion flow on "Get started" click', async () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const button = screen.getByTestId('musd-education-continue-button');
    fireEvent.click(button);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockStartConversionFlow).toHaveBeenCalledWith({
      skipEducation: true,
    });
  });

  it('dispatches setEducationSeen and navigates back on close click', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const closeButton = screen.getByTestId('musd-education-skip-button');
    fireEvent.click(closeButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('dispatches setEducationSeen and navigates back on "Not now" click', () => {
    const store = createMockStore();
    renderWithProvider(<MusdEducationScreen />, store);

    const notNowButton = screen.getByTestId('musd-education-not-now-button');
    fireEvent.click(notNowButton);

    expect(mockDispatch).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });
});
///: END:ONLY_INCLUDE_IF
