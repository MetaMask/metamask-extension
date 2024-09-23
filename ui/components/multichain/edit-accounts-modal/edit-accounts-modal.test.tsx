import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/jest/rendering';
import mockState from '../../../../test/data/mock-state.json';
import configureStore from '../../../store/store';
import { MergedInternalAccount } from '../../../selectors/selectors.types';
import { EditAccountsModal } from '.';

const render = (
  props: {
    onSubmit: (addresses: string[]) => void;
    onClose: () => void;
  } = {
    onSubmit: jest.fn(),
    onClose: jest.fn(),
  },
  state = {},
) => {
  const store = configureStore({
    ...mockState,
    metamask: {
      ...mockState.metamask,
      ...state,
      permissionHistory: {
        'https://test.dapp': {
          eth_accounts: {
            accounts: {
              '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc': 1709225290848,
            },
          },
        },
      },
    },
    activeTab: {
      origin: 'https://test.dapp',
    },
  });

  const accounts = Object.values(
    mockState.metamask.internalAccounts.accounts,
  ) as unknown as MergedInternalAccount[];

  return renderWithProvider(
    <EditAccountsModal
      accounts={accounts}
      defaultSelectedAccountAddresses={[accounts[0].address]}
      activeTabOrigin={'https://test.dapp'}
      {...props}
    />,
    store,
  );
};
describe('EditAccountsModal', () => {
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('shows select all button', async () => {
    const { getByLabelText } = render();
    expect(getByLabelText('Select all')).toBeInTheDocument();
  });

  it('calls onSubmit with the selected account addresses when the connect button is clicked', async () => {
    const onSubmit = jest.fn();
    const { getByTestId } = render({
      onSubmit,
      onClose: jest.fn(),
    });
    fireEvent.click(getByTestId('connect-more-accounts-button'));
    expect(onSubmit).toHaveBeenCalledWith([
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    ]);
  });

  it('calls onClose when the connect button is clicked', async () => {
    const onClose = jest.fn();
    const { getByTestId } = render({
      onSubmit: jest.fn(),
      onClose,
    });
    fireEvent.click(getByTestId('connect-more-accounts-button'));
    expect(onClose).toHaveBeenCalledWith();
  });

  it('shows the disconnect text button when nothing is selected', () => {
    const { getByLabelText, getByTestId } = render();
    fireEvent.click(getByLabelText('Select all'));
    fireEvent.click(getByLabelText('Select all'));
    expect(getByTestId('disconnect-accounts-button')).toHaveTextContent('Disconnect')
  })
});
