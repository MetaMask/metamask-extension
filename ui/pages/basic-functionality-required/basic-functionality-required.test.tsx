import React from 'react';
import { useLocation } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { enLocale as messages } from '../../../test/lib/i18n-helpers';
import { BasicFunctionalityOff } from './basic-functionality-required';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
  useLocation: jest.fn(),
}));

// Avoid unit test warning, by adding a mock for ToggleButton so we don't mount react-toggle-button (which uses deprecated componentWillReceiveProps via react-motion).
jest.mock('react-toggle-button', () => {
  const ReactActual = jest.requireActual<typeof import('react')>('react');
  function mockToggle({
    value,
    onToggle,
    passThroughInputProps,
  }: {
    value: boolean;
    onToggle: (v: boolean) => void;
    passThroughInputProps?: { 'data-testid'?: string };
  }) {
    return ReactActual.createElement('input', {
      type: 'checkbox',
      checked: value,
      'data-testid': passThroughInputProps?.['data-testid'],
      onChange: () => onToggle(value),
      readOnly: true,
    });
  }
  return mockToggle;
});

const mockUseLocation = jest.mocked(useLocation);

const I18N_KEYS = {
  title: 'basicFunctionalityRequired_title',
  description: 'basicFunctionalityRequired_description',
  goToHome: 'basicFunctionalityRequired_goToHome',
  toggleLabel: 'basicFunctionalityRequired_toggleLabel',
  reviewInSettings: 'basicFunctionalityRequired_reviewInSettings',
  openSwapsPage: 'basicFunctionalityRequired_openSwapsPage',
  off: 'off',
  on: 'on',
} as const;

const DESCRIPTION_TEXT =
  "This feature isn't available while basic functionality is turned off. Use the toggle below to turn it on.";

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string) => {
    const mockT: Record<string, string> = {
      [I18N_KEYS.title]: 'Basic functionality is off',
      [I18N_KEYS.description]: DESCRIPTION_TEXT,
      [I18N_KEYS.goToHome]: 'Go to the home page',
      [I18N_KEYS.toggleLabel]: 'Basic functionality',
      [I18N_KEYS.reviewInSettings]: 'Review in settings',
      [I18N_KEYS.openSwapsPage]: 'Open the Swap page',
      [I18N_KEYS.off]: 'Off',
      [I18N_KEYS.on]: 'On',
    };
    return mockT[key] ?? key;
  },
}));

function renderWithStore(
  ui: React.ReactElement,
  { useExternalServices = false } = {},
) {
  const store = configureStore({
    reducer: {
      metamask: () => ({ useExternalServices }),
    },
  });
  return render(<Provider store={store}>{ui}</Provider>);
}

describe('BasicFunctionalityOff', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLocation.mockReturnValue({
      pathname: '/basic-functionality-off',
      state: undefined,
      key: '',
      search: '',
      hash: '',
    } as ReturnType<typeof useLocation>);
  });

  it('renders title and description', () => {
    renderWithStore(<BasicFunctionalityOff />);

    expect(
      screen.getByText(messages.basicFunctionalityRequired_title.message),
    ).toBeInTheDocument();
    expect(screen.getByText(DESCRIPTION_TEXT)).toBeInTheDocument();
  });

  it('renders inline Basic functionality toggle', () => {
    renderWithStore(<BasicFunctionalityOff />);

    expect(
      screen.getByTestId('basic-functionality-off-toggle-row'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(messages.basicFunctionalityRequired_toggleLabel.message),
    ).toBeInTheDocument();
  });

  it('renders Review in settings link', () => {
    renderWithStore(<BasicFunctionalityOff />);

    const reviewLink = screen.getByTestId(
      'basic-functionality-off-review-in-settings',
    );
    expect(reviewLink).toHaveTextContent('Review in settings');
  });

  it('navigates to Security settings when Review in settings is clicked', () => {
    renderWithStore(<BasicFunctionalityOff />);
    screen.getByTestId('basic-functionality-off-review-in-settings').click();

    expect(mockNavigate).toHaveBeenCalledWith('/settings/security');
  });

  it('renders Go to the home page link', () => {
    renderWithStore(<BasicFunctionalityOff />);

    const goHome = screen.getByTestId('basic-functionality-off-go-home');
    expect(goHome).toHaveTextContent('Go to the home page');
  });

  it('navigates to home when Go to the home page is clicked', () => {
    renderWithStore(<BasicFunctionalityOff />);
    screen.getByTestId('basic-functionality-off-go-home').click();

    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  describe('with feature context from guard', () => {
    beforeEach(() => {
      mockUseLocation.mockReturnValue({
        pathname: '/basic-functionality-off',
        state: {
          blockedRoutePath: '/cross-chain/swaps/prepare-bridge-page',
          openPageCtaMessageKey: I18N_KEYS.openSwapsPage,
        },
        key: '',
        search: '',
        hash: '',
      } as ReturnType<typeof useLocation>);
    });

    it('renders primary CTA Open the [feature] page', () => {
      renderWithStore(<BasicFunctionalityOff />);

      expect(
        screen.getByTestId('basic-functionality-off-open-feature'),
      ).toHaveTextContent('Open the Swap page');
    });

    it('disables primary CTA when Basic functionality is off', () => {
      renderWithStore(<BasicFunctionalityOff />, {
        useExternalServices: false,
      });

      const primaryButton = screen.getByTestId(
        'basic-functionality-off-open-feature',
      );
      expect(primaryButton).toBeDisabled();
    });

    it('navigates to blocked route when Open the feature page is clicked with Basic functionality on', () => {
      const store = configureStore({
        reducer: {
          metamask: () => ({ useExternalServices: true }),
        },
      });
      render(
        <Provider store={store}>
          <BasicFunctionalityOff />
        </Provider>,
      );

      const primaryButton = screen.getByTestId(
        'basic-functionality-off-open-feature',
      );
      expect(primaryButton).not.toBeDisabled();
      primaryButton.click();

      expect(mockNavigate).toHaveBeenCalledWith(
        '/cross-chain/swaps/prepare-bridge-page',
      );
    });
  });

  describe('without feature context (e.g. direct navigation to page)', () => {
    it('does not render primary Open feature button', () => {
      mockUseLocation.mockReturnValue({
        pathname: '/basic-functionality-off',
        state: undefined,
        key: '',
        search: '',
        hash: '',
      } as ReturnType<typeof useLocation>);

      renderWithStore(<BasicFunctionalityOff />);

      expect(
        screen.queryByTestId('basic-functionality-off-open-feature'),
      ).not.toBeInTheDocument();
    });
  });
});
