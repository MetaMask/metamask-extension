import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { renderWithProvider } from '../../../../../test/jest';
import configureStore from '../../../../store/store';
import mockState from '../../../../../test/data/mock-state.json';
import ConfirmRemoveJwt from '.';

const props = {
  hideModal: jest.fn(),
  removeAccount: jest.fn().resolves(),
  token: 'jwt',
  custodyAccountDetails: [
    {
      address: '0xAddrEss',
      name: 'name',
      labels: [],
      authDetails: { token: 'jwt' },
    },
  ],
  accounts: [{ address: '0xaddress', balance: '0x0' }],
};

const render = () => {
  const store = configureStore({
    ...mockState,
    metamask: {},
  });

  return renderWithProvider(<ConfirmRemoveJwt {...props} />, store);
};

describe('Confirm Remove JWT', function () {
  beforeEach(() => {
    render();
  });

  afterEach(() => {
    props.hideModal.resetHistory();
  });

  it('should click on nevermind text and hide modal', () => {
    const clickButton = screen.getByText('Nevermind');
    fireEvent.click(clickButton);

    expect(props.hideModal).toHaveBeenCalledTimes(1);
  });

  it('should click on remove text, remove account and hide modal', async () => {
    const clickButton = screen.getByText('Remove');
    fireEvent.click(clickButton);

    expect(props.removeAccount).toHaveBeenCalledTimes(1);
    expect.strictEqual(props.removeAccount.getCall(0).args[0], '0xaddress');

    expect(props.hideModal.calledOnce).toBe(true);
  });

  it('should hide modal when click on close icon', () => {
    const close = screen.getByTestId('modal-header-close');
    close.simulate('click');

    expect(props.hideModal).toHaveBeenCalledTimes(1);
  });
});
