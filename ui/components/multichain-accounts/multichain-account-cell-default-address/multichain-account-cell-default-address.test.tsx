import React from 'react';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { enLocale as messages } from '../../../../test/lib/i18n-helpers';
import configureStore from '../../../store/store';
import mockDefaultState from '../../../../test/data/mock-state.json';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import {
  MultichainAccountCellDefaultAddress,
  MultichainAccountCellDefaultAddressProps,
} from './multichain-account-cell-default-address';

jest.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: jest.fn(),
}));

jest.mock(
  '../multichain-address-rows-triggered-list/multichain-triggered-address-rows-list',
  () => ({
    MultichainTriggeredAddressRowsList: ({
      children,
    }: {
      children: React.ReactNode;
    }) => <div data-testid="triggered-address-rows-list">{children}</div>,
  }),
);

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

describe('MultichainAccountCellDefaultAddress', () => {
  const defaultProps: MultichainAccountCellDefaultAddressProps = {
    groupId: 'entropy:01JKAF3DSGM3AB87EM9N0K41AJ/0',
  };

  beforeEach(() => {
    mockHandleCopy.mockClear();
    mockUseCopyToClipboard.mockReturnValue([false, mockHandleCopy, jest.fn()]);
  });

  it('renders the dropdown button', () => {
    renderWithProvider(
      <MultichainAccountCellDefaultAddress {...defaultProps} />,
      createStore(),
    );

    expect(
      screen.getByTestId('default-address-menu-button'),
    ).toBeInTheDocument();
  });

  it('renders default address when showDefaultAddress preference is true', () => {
    renderWithProvider(
      <MultichainAccountCellDefaultAddress {...defaultProps} />,
      createStore(),
    );

    expect(screen.getByTestId('default-address-container')).toBeInTheDocument();
  });

  it('calls copy handler with normalized address when default address is clicked', () => {
    renderWithProvider(
      <MultichainAccountCellDefaultAddress {...defaultProps} />,
      createStore(),
    );

    const container = screen.getByTestId('default-address-container');
    fireEvent.click(container);

    expect(mockHandleCopy).toHaveBeenCalledTimes(1);
    expect(mockHandleCopy).toHaveBeenCalledWith(
      '0x0DCD5D886577d5081B0c52e242Ef29E70Be3E7bc',
    );
  });

  it('shows copied state when addressCopied is true', () => {
    mockUseCopyToClipboard.mockReturnValue([true, mockHandleCopy, jest.fn()]);

    renderWithProvider(
      <MultichainAccountCellDefaultAddress {...defaultProps} />,
      createStore(),
    );

    expect(
      screen.getByText(
        `${messages.networkNameEthereum.message} ${messages.addressCopied.message.toLowerCase()}`,
      ),
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

    it('does not show address container', () => {
      renderWithProvider(
        <MultichainAccountCellDefaultAddress {...defaultProps} />,
        createStoreWithPrefOff(),
      );

      expect(
        screen.queryByTestId('default-address-container'),
      ).not.toBeInTheDocument();
    });

    it('shows no default address message', () => {
      renderWithProvider(
        <MultichainAccountCellDefaultAddress {...defaultProps} />,
        createStoreWithPrefOff(),
      );

      expect(
        screen.getByText(
          messages.noDefaultAddress.message.replace(
            '$1',
            messages.networkNameEthereum.message,
          ),
        ),
      ).toBeInTheDocument();
    });

    it('does not call copy handler when clicked', () => {
      renderWithProvider(
        <MultichainAccountCellDefaultAddress {...defaultProps} />,
        createStoreWithPrefOff(),
      );

      expect(
        screen.queryByTestId('default-address-container'),
      ).not.toBeInTheDocument();
      expect(mockHandleCopy).not.toHaveBeenCalled();
    });
  });
});
