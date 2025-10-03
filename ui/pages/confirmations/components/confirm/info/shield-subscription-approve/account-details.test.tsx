import React from 'react';
import configureMockStore from 'redux-mock-store';
import { getMockConfirmState } from '../../../../../../../test/data/confirmations/helper';
import { renderWithProvider } from '../../../../../../../test/lib/render-helpers';
import { AccountDetails } from './account-details';

jest.mock('../../../../../../components/app/confirm/info/row/address', () => ({
  ConfirmInfoRowAddress: ({ address }: { address: string }) => (
    <div>{address}</div>
  ),
}));

describe('AccountDetails', () => {
  it('renders correctly', () => {
    const state = getMockConfirmState();
    const mockStore = configureMockStore([])(state);
    const { container } = renderWithProvider(
      <AccountDetails accountAddress={'0xFrom'} chainId={'0x5'} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
