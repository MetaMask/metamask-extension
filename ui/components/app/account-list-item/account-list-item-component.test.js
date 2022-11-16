import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import AccountListItem from './account-list-item';

jest.mock('../../../../shared/modules/hexstring-utils', () => ({
  ...jest.requireActual('../../../../shared/modules/hexstring-utils'),
  toChecksumHexAddress: jest.fn(() => 'mockCheckSumAddress'),
}));

describe('AccountListItem Component', () => {
  const store = configureStore()(mockState);

  describe('render', () => {
    const props = {
      account: {
        address: 'mockAddress',
        name: 'mockName',
        balance: 'mockBalance',
      },
      className: 'mockClassName',
      displayAddress: false,
      icon: <i className="mockIcon" />,
      handleClick: jest.fn(),
    };

    it('should match snapshot', () => {
      const { container } = renderWithProvider(
        <AccountListItem {...props} />,
        store,
      );

      expect(container).toMatchSnapshot();
    });

    it('should call handleClick with the expected props when the root div is clicked', () => {
      const { getByTestId } = renderWithProvider(
        <AccountListItem {...props} />,
        store,
      );
      const accountListItem = getByTestId('account-list-item');
      fireEvent.click(accountListItem);

      expect(props.handleClick).toHaveBeenCalledWith({
        address: 'mockAddress',
        name: 'mockName',
        balance: 'mockBalance',
      });
    });

    it('should show the account name if it exists', () => {
      const { queryByText } = renderWithProvider(
        <AccountListItem {...props} />,
        store,
      );
      expect(queryByText('mockName')).toBeInTheDocument();
    });

    it('should show the account address if there is no name', () => {
      const noAccountNameProps = {
        ...props,
        account: {
          address: 'addressButNoName',
        },
      };

      const { queryByText } = renderWithProvider(
        <AccountListItem {...noAccountNameProps} />,
        store,
      );
      expect(queryByText('addressButNoName')).toBeInTheDocument();
    });

    it('should not render an icon if none is passed', () => {
      const noIconProps = {
        ...props,
        icon: null,
      };

      const { queryByTestId } = renderWithProvider(
        <AccountListItem {...noIconProps} />,
        store,
      );
      const accountListItemIcon = queryByTestId('account-list-item-icon');

      expect(accountListItemIcon).not.toBeInTheDocument();
    });

    it('should render the account address as a checksumAddress if displayAddress is true and name is provided', () => {
      const { queryByText, rerender } = renderWithProvider(
        <AccountListItem {...props} />,
        store,
      );
      expect(queryByText('mockCheckSumAddress')).not.toBeInTheDocument();

      const displayAddressProps = {
        ...props,
        displayAddress: true,
      };

      rerender(<AccountListItem {...displayAddressProps} />);
      expect(queryByText('mockCheckSumAddress')).toBeInTheDocument();
    });
  });
});
