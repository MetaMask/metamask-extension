import React from 'react';
import { fireEvent } from '@testing-library/react';
import configureStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import testData from '../../../../.storybook/test-data';
import ConfirmRemoveJwt from '.';

const address = '0xaD6D458402F60fD3Bd25163575031ACDce07538D';

const props = {
  hideModal: jest.fn(),
  removeAccount: jest.fn(),
  token: { address },
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

const mockStore = {
  ...testData,
  metamask: {},
};

const store = configureStore()(mockStore);

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
});
