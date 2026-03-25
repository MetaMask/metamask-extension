import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import type { AccountGroupId } from '@metamask/account-api';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  MultichainAccountNetworkGroupWithCopyIcon,
  MultichainAccountNetworkGroupWithCopyIconProps,
} from './multichain-account-network-group-with-copy-icon';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

const mockHandleCopy = jest.fn();
const mockUseCopyToClipboard = useCopyToClipboard as jest.MockedFunction<
  typeof useCopyToClipboard
>;

const createStore = (overrides = {}) =>
  configureStore({
    ...mockDefaultState,
    metamask: {
      ...mockDefaultState.metamask,
      remoteFeatureFlags: {
        ...mockDefaultState.metamask.remoteFeatureFlags,
        extensionUxDefaultAddressVersioned: true,
      },
      ...overrides,
    },
  });

describe('MultichainAccountNetworkGroupWithCopyIcon', () => {
  const defaultProps: MultichainAccountNetworkGroupWithCopyIconProps = {
    groupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  };

  beforeEach(() => {
    mockHandleCopy.mockClear();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);
  });

  it('renders default-address-container when default address is available', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
      createStore(),
    );

    const container = screen.getByTestId('default-address-container');
    expect(container).toBeInTheDocument();
  });

  it('calls copy handler with normalized address when container is clicked', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
      createStore(),
    );

    const container = screen.getByTestId('default-address-container');
    fireEvent.click(container);

    expect(mockHandleCopy).toHaveBeenCalledTimes(1);
    expect(mockHandleCopy).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
    );
  });

  it('has cursor-pointer class when showDefaultAddress preference is true', () => {
    renderWithProvider(
      <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
      createStore(),
    );

    const container = screen.getByTestId('network-group-with-copy-icon');
    expect(container).toHaveClass('cursor-pointer');
  });

  it('shows copied state when addressCopied is true', () => {
    mockUseCopyToClipboard.mockReturnValue([true, mockHandleCopy, jest.fn()]);

    renderWithProvider(
      <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
      createStore(),
    );

    expect(
      screen.getByText(messages.addressCopied.message),
    ).toBeInTheDocument();
  });

  describe('when showDefaultAddress preference is false', () => {
    const createStoreWithPrefOff = () =>
      createStore({
        preferences: {
          ...mockDefaultState.metamask.preferences,
          showDefaultAddress: false,
        },
      });

    it('does not show address text', () => {
      renderWithProvider(
        <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
        createStoreWithPrefOff(),
      );

      expect(
        screen.queryByTestId('default-address-container'),
      ).not.toBeInTheDocument();
    });

    it('does not call copy handler when container is clicked', () => {
      renderWithProvider(
        <MultichainAccountNetworkGroupWithCopyIcon {...defaultProps} />,
        createStoreWithPrefOff(),
      );

      const container = screen.getByTestId('network-group-with-copy-icon');
      fireEvent.click(container);

      expect(mockHandleCopy).not.toHaveBeenCalled();
    });
  });
});
