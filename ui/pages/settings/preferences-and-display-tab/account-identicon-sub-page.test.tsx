import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { AvatarAccountVariant } from '@metamask/design-system-react';
import mockState from '../../../../test/data/mock-state.json';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { setBackgroundConnection } from '../../../store/background-connection';
import { PREFERENCES_AND_DISPLAY_ROUTE } from '../../../helpers/constants/routes';
import AccountIdenticonSubPage from './account-identicon-sub-page';

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

const mockSetAvatarType = jest.fn();
jest.mock('../../../store/actions', () => ({
  ...jest.requireActual('../../../store/actions'),
  setAvatarType: (val: string) => {
    mockSetAvatarType(val);
    return { type: 'MOCK_ACTION' };
  },
}));

const backgroundConnectionMock = new Proxy(
  {},
  { get: () => jest.fn().mockResolvedValue(undefined) },
);

describe('AccountIdenticonSubPage', () => {
  const mockStore = configureMockStore([thunk])(mockState);

  beforeEach(() => {
    jest.clearAllMocks();
    setBackgroundConnection(backgroundConnectionMock as never);
  });

  it('renders identicon options', () => {
    renderWithProvider(<AccountIdenticonSubPage />, mockStore);

    expect(screen.getByText(messages.maskicons.message)).toBeInTheDocument();
    expect(screen.getByText(messages.jazzicons.message)).toBeInTheDocument();
    expect(screen.getByText(messages.blockies.message)).toBeInTheDocument();
  });

  it('calls setAvatarType and navigates when an identicon is clicked', () => {
    const storeWithBlockies = configureMockStore([thunk])({
      ...mockState,
      metamask: {
        ...mockState.metamask,
        preferences: {
          ...mockState.metamask.preferences,
          avatarType: AvatarAccountVariant.Blockies,
        },
      },
    });
    renderWithProvider(<AccountIdenticonSubPage />, storeWithBlockies);

    fireEvent.click(screen.getByText(messages.maskicons.message));

    expect(mockSetAvatarType).toHaveBeenCalledWith(
      AvatarAccountVariant.Maskicon,
    );
    expect(mockNavigate).toHaveBeenCalledWith(PREFERENCES_AND_DISPLAY_ROUTE);
  });
});
