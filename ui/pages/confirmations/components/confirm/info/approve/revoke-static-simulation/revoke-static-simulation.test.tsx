import React from 'react';
import { screen } from '@testing-library/react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { getMockConfirmStateForTransaction } from '../../../../../../../../test/data/confirmations/helper';
import {
  genUnapprovedApproveConfirmation,
  genUnapprovedPermit2ApproveConfirmation,
} from '../../../../../../../../test/data/confirmations/token-approve';
import { renderWithConfirmContextProvider } from '../../../../../../../../test/lib/confirmations/render-helpers';
import { RevokeStaticSimulation } from './revoke-static-simulation';

describe('<RevokeStaticSimulation />', () => {
  const middleware = [thunk];

  function buildRevokeApproveConfirmation() {
    return genUnapprovedApproveConfirmation({
      chainId: '0x5',
      amountHex:
        '0000000000000000000000000000000000000000000000000000000000000000',
    });
  }

  it('displays the spender address from the transaction data', () => {
    const state = getMockConfirmStateForTransaction(
      buildRevokeApproveConfirmation(),
    );
    const mockStore = configureMockStore(middleware)(state);

    renderWithConfirmContextProvider(<RevokeStaticSimulation />, mockStore);

    expect(screen.getByText('0x2e0D7...5d09B')).toBeInTheDocument();
  });

  it('displays the token and spender from the calldata for Permit2 approvals', () => {
    const state = getMockConfirmStateForTransaction(
      genUnapprovedPermit2ApproveConfirmation({ amount: 0 }),
    );
    const mockStore = configureMockStore(middleware)(state);

    renderWithConfirmContextProvider(<RevokeStaticSimulation />, mockStore);

    expect(screen.getByText('0x11111...11111')).toBeInTheDocument();
    expect(screen.getByText('0x22222...22222')).toBeInTheDocument();
    expect(screen.queryByText('0x00000...78BA3')).not.toBeInTheDocument();
  });
});
