import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { AvatarAccountSize } from '@metamask/design-system-react';
import { TextAlign } from '../../../helpers/constants/design-system';
import { TraceName } from '../../../../shared/lib/trace';
import type { AccountPickerProps } from './account-picker';
import { AccountPicker } from '.';

const mockTrace = jest.fn();

jest.mock('../../../../shared/lib/trace', () => ({
  trace: (request: unknown) => mockTrace(request),
  TraceName: {
    AccountList: 'Account List',
  },
}));

jest.mock('../../app/preferred-avatar', () => {
  const react = jest.requireActual<typeof import('react')>('react');

  return {
    PreferredAvatar: ({
      address,
      size,
    }: {
      address: string;
      size: AvatarAccountSize;
    }) =>
      react.createElement('span', {
        'data-address': address,
        'data-size': size,
        'data-testid': 'preferred-avatar',
      }),
  };
});

const DEFAULT_PROPS = {
  name: 'Account 1',
  address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
  onClick: jest.fn(),
} satisfies AccountPickerProps;

const renderAccountPicker = (props: Partial<AccountPickerProps> = {}) =>
  render(<AccountPicker {...DEFAULT_PROPS} {...props} />);

describe('AccountPicker', () => {
  beforeEach(() => {
    DEFAULT_PROPS.onClick.mockClear();
    mockTrace.mockClear();
  });

  it('renders the account name and compact avatar by default', () => {
    renderAccountPicker();

    expect(screen.getByText('Account 1')).toBeInTheDocument();
    expect(screen.queryByText('0x0DCD5...3E7bc')).not.toBeInTheDocument();
    expect(screen.getByTestId('preferred-avatar')).toHaveAttribute(
      'data-address',
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    expect(screen.getByTestId('preferred-avatar')).toHaveAttribute(
      'data-size',
      AvatarAccountSize.Xs,
    );
    expect(screen.getByTestId('account-menu-icon')).toHaveClass(
      'multichain-account-picker',
    );
    expect(screen.getByTestId('account-menu-icon')).toHaveClass(
      'mm-button-base--size-sm',
    );
  });

  it('renders the checksummed shortened address and larger avatar when address display is enabled', () => {
    renderAccountPicker({
      showAddress: true,
      addressProps: {
        className: 'custom-address',
        'data-testid': 'account-address',
      },
    });

    expect(screen.getByTestId('account-address')).toHaveTextContent(
      '0x0DCD5...3E7bc',
    );
    expect(screen.getByTestId('account-address')).toHaveClass('custom-address');
    expect(screen.getByTestId('preferred-avatar')).toHaveAttribute(
      'data-size',
      AvatarAccountSize.Md,
    );
    expect(screen.getByTestId('account-menu-icon')).toHaveClass(
      'mm-button-base--size-lg',
    );
  });

  it('renders an empty address when address display is enabled without an address', () => {
    renderAccountPicker({
      address: '',
      showAddress: true,
      showAvatarAccount: false,
      addressProps: {
        'data-testid': 'account-address',
      },
    });

    expect(screen.queryByTestId('preferred-avatar')).not.toBeInTheDocument();
    expect(screen.getByTestId('account-address')).toHaveTextContent('');
  });

  it('applies custom class names and text props', () => {
    const { container } = renderAccountPicker({
      className: 'test-class',
      labelProps: {
        className: 'custom-label',
        'data-testid': 'account-label',
        style: {
          color: 'red',
        },
        textAlign: TextAlign.Left,
      },
      textProps: {
        className: 'custom-text',
      },
    });

    expect(screen.getByTestId('account-menu-icon')).toHaveClass('test-class');
    expect(screen.getByTestId('account-label')).toHaveClass('custom-label');
    expect(screen.getByTestId('account-label')).toHaveStyle({
      color: 'red',
      fontWeight: '500',
    });
    expect(container.querySelector('.custom-text')).toBeInTheDocument();
  });

  it('traces account list opening and calls the click handler when clicked', () => {
    const onClick = jest.fn();
    renderAccountPicker({ onClick });

    fireEvent.click(screen.getByTestId('account-menu-icon'));

    expect(mockTrace).toHaveBeenCalledWith({ name: TraceName.AccountList });
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('does not call the click handler when disabled', () => {
    const onClick = jest.fn();
    renderAccountPicker({ disabled: true, onClick });

    const button = screen.getByTestId('account-menu-icon');
    expect(button).toBeDisabled();

    fireEvent.click(button);

    expect(onClick).not.toHaveBeenCalled();
    expect(mockTrace).not.toHaveBeenCalled();
  });
});
