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
  openSettings: 'basicFunctionalityRequired_openSettings',
  goToHome: 'basicFunctionalityRequired_goToHome',
  settingsHint: 'basicFunctionalityRequired_settingsHint',
} as const;

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: React.ReactNode[]) => {
    const messages: Record<string, string> = {};
    messages[I18N_KEYS.title] = "This feature isn't available";
    messages[I18N_KEYS.description] =
      'This page needs Basic functionality to be turned on.';
    messages[I18N_KEYS.openSettings] = 'Open Settings';
    messages[I18N_KEYS.goToHome] = 'Go to the home page';

    if (key === I18N_KEYS.settingsHint && substitutions?.[0]) {
      return <>Go to Settings or use {substitutions[0]}.</>;
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
      screen.getByText("This feature isn't available"),
    ).toBeInTheDocument();
    expect(
      screen.getByText('This page needs Basic functionality to be turned on.'),
    ).toBeInTheDocument();
  });

  it('renders Go to the home page button', () => {
    render(<BasicFunctionalityRequired />);

    const goHomeButton = screen.getByTestId(
      'basic-functionality-required-go-home',
    );
    expect(goHomeButton).toHaveTextContent('Go to the home page');
  });

  it('navigates to home when Go to the home page is clicked', () => {
    const navigate = jest.fn();
    mockNavigate.mockReturnValue(navigate);

    render(<BasicFunctionalityRequired />);
    screen.getByTestId('basic-functionality-required-go-home').click();

    expect(navigate).toHaveBeenCalledWith('/');
  });

  it('renders Open Settings link', () => {
    render(<BasicFunctionalityRequired />);

    const settingsLink = screen.getByTestId(
      'basic-functionality-required-settings-link',
    );
    expect(settingsLink).toHaveTextContent('Open Settings');
  });

  it('navigates to security settings when Open Settings is clicked', () => {
    const navigate = jest.fn();
    mockNavigate.mockReturnValue(navigate);

    render(<BasicFunctionalityRequired />);
    screen.getByTestId('basic-functionality-required-settings-link').click();

    expect(navigate).toHaveBeenCalledWith('/settings/security');
  });
});
