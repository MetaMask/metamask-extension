import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import { ThemeType } from '../../../../shared/constants/preferences';
import ThemeSubPage from './theme-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetTheme = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setTheme: (val: string) => {
    mockSetTheme(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('ThemeSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders theme options', () => {
    renderWithProvider(<ThemeSubPage />, mockStore);

    expect(screen.getByText(messages.lightTheme.message)).toBeInTheDocument();
    expect(screen.getByText(messages.darkTheme.message)).toBeInTheDocument();
    expect(screen.getByText(messages.osTheme.message)).toBeInTheDocument();
  });

  it('calls setTheme and navigates when a theme is clicked', () => {
    const storeWithDarkTheme = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        theme: ThemeType.dark,
      },
    });
    renderWithProvider(<ThemeSubPage />, storeWithDarkTheme);

    fireEvent.click(screen.getByText(messages.lightTheme.message));

    expect(mockSetTheme).toHaveBeenCalledWith(ThemeType.light);
    expect(mockNavigate).toHaveBeenCalledWith(PREFERENCES_AND_DISPLAY_ROUTE);
  });
});
