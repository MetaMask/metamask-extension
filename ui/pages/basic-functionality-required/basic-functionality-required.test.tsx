import React from 'react';
import { useNavigate } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { BasicFunctionalityRequired } from './basic-functionality-required';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

const I18N_KEYS = {
  title: 'basicFunctionalityRequired_title',
  description: 'basicFunctionalityRequired_description',
  settingsLinkText: 'basicFunctionalityRequired_settingsLinkText',
  goToHome: 'basicFunctionalityRequired_goToHome',
} as const;

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: React.ReactNode[]) => {
    const messages: Record<string, string> = {};
    messages[I18N_KEYS.title] = 'Basic functionality is off';
    messages[I18N_KEYS.settingsLinkText] = 'Settings > Security and privacy';
    messages[I18N_KEYS.goToHome] = 'Back to home';

    if (key === I18N_KEYS.description && substitutions?.[0]) {
      return (
        <>
          This feature isn't available while basic functionality is turned off.
          Turn it on in {substitutions[0]} to continue.
        </>
      );
    }
    return messages[key] ?? key;
  },
}));

const mockNavigate = jest.mocked(useNavigate);

describe('BasicFunctionalityRequired', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockNavigate.mockReturnValue(jest.fn());
  });

  it('renders title and description', () => {
    render(<BasicFunctionalityRequired />);

    expect(
      screen.getByText('Basic functionality is off'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /This feature isn't available while basic functionality is turned off/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Settings > Security and privacy'),
    ).toBeInTheDocument();
  });

  it('renders Back to home button', () => {
    render(<BasicFunctionalityRequired />);

    const goHomeButton = screen.getByTestId(
      'basic-functionality-required-go-home',
    );
    expect(goHomeButton).toHaveTextContent('Back to home');
  });

  it('navigates to home when Back to home is clicked', () => {
    const navigate = jest.fn();
    mockNavigate.mockReturnValue(navigate);

    render(<BasicFunctionalityRequired />);
    screen.getByTestId('basic-functionality-required-go-home').click();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('renders Settings > Security and privacy link', () => {
    render(<BasicFunctionalityRequired />);

    const settingsLink = screen.getByTestId(
      'basic-functionality-required-settings-link',
    );
    expect(settingsLink).toHaveTextContent('Settings > Security and privacy');
  });

  it('navigates to security settings when Settings link is clicked', () => {
    const navigate = jest.fn();
    mockNavigate.mockReturnValue(navigate);

    render(<BasicFunctionalityRequired />);
    screen.getByTestId('basic-functionality-required-settings-link').click();

    expect(navigate).toHaveBeenCalledWith('/settings/security');
  });
});
