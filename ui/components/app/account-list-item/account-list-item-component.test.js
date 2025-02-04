import React from 'react';
import configureStore from 'redux-mock-store';
import { fireEvent } from '@testing-library/react';
import { EthAccountType } from '@metamask/keyring-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { ETH_EOA_METHODS } from '../../../../shared/constants/eth-methods';
import AccountListItem from './account-list-item';

describe('AccountListItem Component', () => {
  const store = configureStore()(mockState);

  describe('render', () => {
    const props = {
      account: {
        // NOTE: We now uses an explicit "0x" prefix since the support of non-EVM addresses
        // accross the extension
        address: '0xmockAddress',
        balance: 'mockBalance',
        id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
        metadata: {
          name: 'mockName',
          keyring: {
            type: 'HD Key Tree',
          },
        },
        options: {},
        methods: ETH_EOA_METHODS,
        type: EthAccountType.Eoa,
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
        address: '0xmockAddress',
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
          balance: 'mockBalance',
          id: 'cf8dace4-9439-4bd4-b3a8-88c821c8fcb3',
          metadata: {
            name: '',
            keyring: {
              type: 'HD Key Tree',
            },
          },
          options: {},
          methods: ETH_EOA_METHODS,
          type: EthAccountType.Eoa,
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
      expect(queryByText('0xmockAddress')).not.toBeInTheDocument();

      const displayAddressProps = {
        ...props,
        displayAddress: true,
      };

      rerender(<AccountListItem {...displayAddressProps} />);

      expect(queryByText('0xmockAddress')).toBeInTheDocument();
    });
  });
});
