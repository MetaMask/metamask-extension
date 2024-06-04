/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, renderWithProvider } from '../../../../test/jest';
import configureStore from '../../../store/store';
import mockState from '../../../../test/data/mock-state.json';
import { CreateBtcAccount } from '.';

const render = (props = { onActionComplete: jest.fn() }) => {
  const store = configureStore(mockState);
  return renderWithProvider(<CreateBtcAccount {...props} />, store);
};

const ACCOUNT_NAME = 'Bitcoin Account';

describe('CreateBtcAccount', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('displays account name input and suggests name', () => {
    const { getByPlaceholderText } = render();

    expect(getByPlaceholderText(ACCOUNT_NAME)).toBeInTheDocument();
  });

  it('fires onActionComplete when clicked', async () => {
    const onActionComplete = jest.fn();
    const { getByText, getByPlaceholderText } = render({ onActionComplete });

    const input = getByPlaceholderText(ACCOUNT_NAME);
    const newAccountName = 'New Account Name';

    fireEvent.change(input, {
      target: { value: newAccountName },
    });
    fireEvent.click(getByText('Create'));

    // TODO: Add logic to rename account
  });

  it(`doesn't allow duplicate account names`, async () => {
    const { getByText, getByPlaceholderText } = render();

    const input = getByPlaceholderText(ACCOUNT_NAME);
    const usedAccountName =
      mockState.metamask.internalAccounts.accounts[
        '07c2cfec-36c9-46c4-8115-3836d3ac9047'
      ].metadata.name;

    fireEvent.change(input, {
      target: { value: usedAccountName },
    });

    const submitButton = getByText('Create');
    expect(submitButton).toHaveAttribute('disabled');
  });
});
