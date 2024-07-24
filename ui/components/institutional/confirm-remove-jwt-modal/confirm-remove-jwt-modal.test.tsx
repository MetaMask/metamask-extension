import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import ConfirmRemoveJwt from '.';

const mockedRemoveAccount = jest.fn();
const mockedHideModal = jest.fn();

jest.mock('../../../store/actions', () => ({
  removeAccount: () => mockedRemoveAccount,
  hideModal: () => mockedHideModal,
}));

const address = '0xaD6D458402F60fD3Bd25163575031ACDce07538D';

const props = {
  hideModal: mockedHideModal,
  token: address,
  custodyAccountDetails: [
    {
      address,
      name: 'Test name account',
      labels: [],
      authDetails: { token: address },
    },
  ],
  accounts: [{ address, balance: '0x0' }],
};

const middleware = [thunk];
const store = configureMockStore(middleware)(mockState);

const render = () => {
  return renderWithProvider(<ConfirmRemoveJwt {...props} />, store);
};

describe('Confirm Remove JWT', function () {
  it('should render correctly', () => {
    const { container } = render();

    expect(container).toMatchSnapshot();
  });

  it('should show full token address when "show more" is clicked', () => {
    const { getByText } = render();

    const showMoreLink = getByText('Show more');
    fireEvent.click(showMoreLink);

    const fullTokenAddress = getByText(address);
    expect(fullTokenAddress).toBeInTheDocument();
  });

  it('dispatches removeAccount action when user clicks remove button', async () => {
    const { getByText } = render();

    const removeButton = getByText('Remove');
    fireEvent.click(removeButton);

    await waitFor(() => expect(mockedRemoveAccount).toHaveBeenCalled());
    expect(mockedHideModal).toHaveBeenCalled();
  });
});
