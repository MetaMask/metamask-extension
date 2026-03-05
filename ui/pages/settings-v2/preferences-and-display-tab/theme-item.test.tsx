import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { THEME_ROUTE } from '../../../helpers/constants/routes';
import { ThemeType } from '../../../../shared/constants/preferences';
import { ThemeItem } from './theme-item';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ThemeItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<ThemeItem />, mockStore);

    expect(screen.getByText(messages.theme.message)).toBeInTheDocument();
  });

  it('displays current theme correctly', () => {
    const storeWithLightTheme = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        theme: ThemeType.light,
      },
    });
    renderWithProvider(<ThemeItem />, storeWithLightTheme);

    expect(screen.getByText(messages.lightTheme.message)).toBeInTheDocument();
  });

  it('renders navigation button', () => {
    renderWithProvider(<ThemeItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.theme.message,
    });
    expect(button).toBeInTheDocument();
  });

  it('navigates to theme page when clicked', () => {
    renderWithProvider(<ThemeItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.theme.message,
    });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(THEME_ROUTE);
  });
});
