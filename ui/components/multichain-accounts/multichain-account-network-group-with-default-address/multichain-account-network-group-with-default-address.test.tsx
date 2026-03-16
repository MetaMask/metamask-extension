import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  MultichainAccountNetworkGroupWithDefaultAddress,
  MultichainAccountNetworkGroupWithDefaultAddressProps,
} from './multichain-account-network-group-with-default-address';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

const mockHandleCopy = jest.fn();
const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;

describe('MultichainAccountNetworkGroupWithDefaultAddress', () => {
  const store = configureStore(mockDefaultState);
  const defaultProps: MultichainAccountNetworkGroupWithDefaultAddressProps = {
    groupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  };

  beforeEach(() => {
    mockHandleCopy.mockClear();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);
  });

  it('returns null when group has no default address', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithDefaultAddress
        groupId={
          'nonExistentGroupId' as MultichainAccountNetworkGroupWithDefaultAddressProps['groupId']
        }
      />,
      store,
    );

    expect(
      screen.queryByTestId('default-address-container'),
    ).not.toBeInTheDocument();
  });

  it('renders default-address-container when default address is available', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithDefaultAddress {...defaultProps} />,
      store,
    );

    const container = screen.getByTestId('default-address-container');
    expect(container).toBeInTheDocument();
  });

  it('calls copy handler with normalized address when container is clicked', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithDefaultAddress {...defaultProps} />,
      store,
    );

    const container = screen.getByTestId('default-address-container');
    fireEvent.click(container);

    expect(mockHandleCopy).toHaveBeenCalledTimes(1);
    // normalizeSafeAddress returns checksummed form
    expect(mockHandleCopy).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
    );
  });

  it('shows copied state when addressCopied is true', () => {
    mockUseCopyToClipboard.mockReturnValue([true, mockHandleCopy, jest.fn()]);

    renderWithProvider(
      <MultichainAccountNetworkGroupWithDefaultAddress {...defaultProps} />,
      store,
    );

    expect(
      screen.getByText(messages.addressCopied.message),
    ).toBeInTheDocument();
  });
});
