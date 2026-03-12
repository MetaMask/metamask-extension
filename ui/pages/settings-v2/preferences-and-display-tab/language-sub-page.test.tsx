import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import LanguageSubPage from './language-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockUpdateCurrentLocale = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  updateCurrentLocale: (val: string) => {
    mockUpdateCurrentLocale(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('LanguageSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders language options', () => {
    renderWithProvider(<LanguageSubPage />, mockStore);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('Deutsch')).toBeInTheDocument();
  });

  it('calls updateCurrentLocale and navigates when a language is clicked', () => {
    renderWithProvider(<LanguageSubPage />, mockStore);

    fireEvent.click(screen.getByText('Español'));

    expect(mockUpdateCurrentLocale).toHaveBeenCalledWith('es');
    expect(mockNavigate).toHaveBeenCalledWith(PREFERENCES_AND_DISPLAY_ROUTE);
  });

  it('selects a different language when clicked', () => {
    const storeWithEnLocale = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentLocale: 'en',
      },
    });
    renderWithProvider(<LanguageSubPage />, storeWithEnLocale);

    fireEvent.click(screen.getByText('Deutsch'));

    expect(mockUpdateCurrentLocale).toHaveBeenCalledWith('de');
    expect(mockNavigate).toHaveBeenCalledWith(PREFERENCES_AND_DISPLAY_ROUTE);
  });
});
