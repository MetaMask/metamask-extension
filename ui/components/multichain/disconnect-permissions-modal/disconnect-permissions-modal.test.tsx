import React from 'react';
import { render } from '@testing-library/react';
import { fireEvent } from '../../../../test/jest';

import { DisconnectPermissionsModal } from '.';

describe('DisconnectPermissionsModal', () => {
  const onSkip = jest.fn();
  const onRemoveAll = jest.fn();
  const onClose = jest.fn();

  const args: any = {
    isOpen: true,
    hostname: 'portfolio.metamask.io',
    onClose,
    onSkip,
    onRemoveAll,
    permissions: [
      {
        permission: {
          permissionResponse: {
            permission: {
              data: {
                amountPerSecond: '0xde0b6b3a7640000', // 1 ETH in hex
              },
            },
          },
          siteOrigin: 'portfolio.metamask.io',
        },
        chainId: '0x1',
        permissionType: 'native-token-stream',
      },
    ],
  };

  it('should render correctly', () => {
    const { container } = render(<DisconnectPermissionsModal {...args} />);
    expect(container).toMatchSnapshot();
  });

  it('should fire onSkip when Skip button is clicked', () => {
    const { getByTestId } = render(<DisconnectPermissionsModal {...args} />);
    const skipButton = getByTestId('skip-disconnect-permissions');
    fireEvent.click(skipButton);
    expect(onSkip).toHaveBeenCalled();
  });

  it('should fire onRemoveAll when Remove all button is clicked', () => {
    const { getByTestId } = render(<DisconnectPermissionsModal {...args} />);
    const removeAllButton = getByTestId('remove-all-disconnect-permissions');
    fireEvent.click(removeAllButton);
    expect(onRemoveAll).toHaveBeenCalled();
  });

  it('should fire onClose when close button is clicked', () => {
    const { getByRole } = render(<DisconnectPermissionsModal {...args} />);
    const closeButton = getByRole('button', { name: /close/iu });
    fireEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  it('should display correct title and description', () => {
    const { getByText } = render(<DisconnectPermissionsModal {...args} />);
    expect(getByText('Other permissions on this site')).toBeInTheDocument();
    expect(
      getByText(
        'The following permissions were also found on this site. Do you want to remove them?',
      ),
    ).toBeInTheDocument();
  });

  it('should display permissions list', () => {
    const { getByText } = render(<DisconnectPermissionsModal {...args} />);
    expect(getByText('Token Stream')).toBeInTheDocument();
    expect(getByText('1 ETH per second')).toBeInTheDocument();
  });
});
