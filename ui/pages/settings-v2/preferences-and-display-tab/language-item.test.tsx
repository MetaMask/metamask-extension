import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { LANGUAGE_ROUTE } from '../../../helpers/constants/routes';
import { LanguageItem } from './language-item';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('LanguageItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<LanguageItem />, mockStore);

    expect(screen.getByText(messages.language.message)).toBeInTheDocument();
  });

  it('displays current locale name', () => {
    const storeWithEnLocale = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        currentLocale: 'en',
      },
    });
    renderWithProvider(<LanguageItem />, storeWithEnLocale);

    expect(screen.getByText('English')).toBeInTheDocument();
  });

  it('renders navigation button', () => {
    renderWithProvider(<LanguageItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.language.message,
    });
    expect(button).toBeInTheDocument();
  });

  it('navigates to language page when clicked', () => {
    renderWithProvider(<LanguageItem />, mockStore);

    const button = screen.getByRole('button', {
      name: messages.language.message,
    });
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(LANGUAGE_ROUTE);
  });
});
