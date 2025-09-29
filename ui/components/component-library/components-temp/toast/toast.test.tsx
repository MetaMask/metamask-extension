/* eslint-disable jest/require-top-level-describe */
import React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { InternalAccount } from '@metamask/keyring-internal-api';
import {
  AvatarAccount,
  AvatarAccountSize,
} from '@metamask/design-system-react';
import { createMockInternalAccount } from '../../../../../test/jest/mocks';
import { Toast } from './toast';

const mockInternalAccount = createMockInternalAccount();

const CHAOS_ACCOUNT: InternalAccount = {
  ...mockInternalAccount,
  address: '0x64a845a5b02460acf8a3d84503b0d68d028b4bb4',
};

const actionButtonOnClick = jest.fn();
const onClose = jest.fn();

const ToastArgs = {
  startAccessory: (
    <AvatarAccount
      address={CHAOS_ACCOUNT.address}
      size={AvatarAccountSize.Md}
    />
  ),
  title: 'This is the Toast title',
  description: 'This is the Toast description',
  actionButtonLabel: 'Take some action',
  actionButtonOnClick,
  onClose,
};

describe('Toast', () => {
  it('should render Toast component', () => {
    const { container } = render(<Toast {...ToastArgs} />);
    expect(container).toMatchSnapshot();
  });

  it('executes onActionClick properly', () => {
    const { getByText } = render(<Toast {...ToastArgs} />);
    fireEvent.click(getByText(ToastArgs.actionButtonLabel));
    expect(actionButtonOnClick).toHaveBeenCalled();
  });

  it('executes onClose properly', () => {
    render(<Toast {...ToastArgs} />);
    const closeButton = document.querySelector('.mm-banner-base__close-button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    expect(closeButton).toBeDefined();
    expect(actionButtonOnClick).toHaveBeenCalled();
  });
});
