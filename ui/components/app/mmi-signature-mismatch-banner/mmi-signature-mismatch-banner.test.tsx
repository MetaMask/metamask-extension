import React from 'react';

import { EthAccountType, EthMethod } from '@metamask/keyring-api';

import { unapprovedPersonalSignMsg } from '../../../../test/data/confirmations/personal_sign';
import mockState from '../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { shortenAddress } from '../../../helpers/utils/util';
import configureStore from '../../../store/store';

import { MMISignatureMismatchBanner } from '.';

const selectedAccount = {
  address: '0xeb9e64b93097bc15f01f13eae97015c57ab64823',
  id: '7ae06c6d-114a-4319-bf75-9fa3efa2c8b9',
  metadata: {
    name: 'Account 1',
    keyring: {
      type: 'HD Key Tree',
    },
  },
  options: {},
  methods: [...Object.values(EthMethod)],
  type: EthAccountType.Eoa,
};

const address = '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc';

const render = () => {
  const internalAccounts = {
    accounts: {
      ...mockState.metamask.internalAccounts.accounts,
      [selectedAccount.id]: selectedAccount,
    },
    selectedAccount: selectedAccount.id,
  };

  const store = configureStore({
    metamask: {
      ...mockState.metamask,
      internalAccounts,
    },
    confirm: {
      currentConfirmation: {
        ...unapprovedPersonalSignMsg,
        msgParams: { ...unapprovedPersonalSignMsg.msgParams, from: address },
      },
    },
  });

  return renderWithProvider(<MMISignatureMismatchBanner />, store);
};

describe('MMISignatureMismatchBanner', () => {
  it('should display mismatch info when selected account address and from account address are not the same', () => {
    const mismatchAccountText = `Your selected account (${shortenAddress(
      selectedAccount.address,
    )}) is different than the account trying to sign (${shortenAddress(
      address,
    )})`;

    const { getByText } = render();

    expect(getByText(mismatchAccountText)).toBeInTheDocument();
  });
});
