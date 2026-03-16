import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { AvatarAccountVariant } from '@metamask/design-system-react';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { ACCOUNT_IDENTICON_ROUTE } from '../../../helpers/constants/routes';
import { AccountIdenticonItem } from './account-identicon-item';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('AccountIdenticonItem', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders title', () => {
    renderWithProvider(<AccountIdenticonItem />, mockStore);

    expect(
      screen.getByText(messages.accountIdenticon.message),
    ).toBeInTheDocument();
  });

  it('displays current identicon correctly', () => {
    const storeWithMaskicon = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          avatarType: AvatarAccountVariant.Maskicon,
        },
      },
    });
    renderWithProvider(<AccountIdenticonItem />, storeWithMaskicon);

    expect(screen.getByText(messages.maskicons.message)).toBeInTheDocument();
  });

  it('renders navigation button', () => {
    renderWithProvider(<AccountIdenticonItem />, mockStore);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('navigates to account identicon page when clicked', () => {
    renderWithProvider(<AccountIdenticonItem />, mockStore);

    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(mockNavigate).toHaveBeenCalledWith(ACCOUNT_IDENTICON_ROUTE);
  });
});
