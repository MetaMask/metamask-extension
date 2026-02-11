import React from 'react';
import { useNavigate } from 'react-router-dom';
import { render, screen } from '@testing-library/react';
import { BasicFunctionalityRequired } from './basic-functionality-required';

jest.mock('react-router-dom', () => ({
  useNavigate: jest.fn(),
}));

jest.mock('../../hooks/useI18nContext', () => ({
  useI18nContext: () => (key: string, substitutions?: React.ReactNode[]) => {
    const messages: Record<string, string> = {};
    messages['basicFunctionalityRequired_title'] =
      "This feature isn't available";
    messages['basicFunctionalityRequired_description'] =
      'This page needs Basic functionality to be turned on.';
    messages['basicFunctionalityRequired_openSettings'] = 'Open Settings';
    messages['basicFunctionalityRequired_goToHome'] = 'Go to home';

    if (
      key === 'basicFunctionalityRequired_settingsHint' &&
      substitutions?.[0]
    ) {
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

  it('renders Go to home button', () => {
    render(<BasicFunctionalityRequired />);

    const goHomeButton = screen.getByTestId(
      'basic-functionality-required-go-home',
    );
    expect(goHomeButton).toHaveTextContent('Go to home');
  });

  it('navigates to home when Go to home is clicked', () => {
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
