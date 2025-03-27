import React from 'react';
import { fireEvent } from '@testing-library/react';
import { Box, AddressInput } from '@metamask/snaps-sdk/jsx';
import { createSnapInterfaceRenderer } from '../../../../../test/lib/snap-ui-test-utils';

describe('SnapUIAddressInput', () => {
  it('renders basic address input', () => {
    const { container, getByRole } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox');
    expect(input).toBeDefined();
    expect(input.value).toBe('');
    expect(container).toMatchSnapshot();
  });

  it('renders with existing state', () => {
    const testAddress = '0x1234567890123456789012345678901234567890';
    const { container, getByRole } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
      {
        state: { input: `eip155:0:${testAddress}` },
      },
    );

    const input = getByRole('textbox');
    expect(input).toBeDefined();
    expect(input.value).toBe(testAddress);
    expect(container).toMatchSnapshot();
  });

  it('renders with placeholder', () => {
    const { getByRole } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          placeholder: 'Enter an address',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox');
    expect(input.placeholder).toBe('Enter an address');
  });

  it('supports disabled state', () => {
    const { getByRole } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          disabled: true,
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox');
    expect(input).toBeDisabled();
  });

  it('renders matched address info when address is valid', () => {
    const { container, getByRole, getByText } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox');
    fireEvent.change(input, {
      target: {
        value: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
      },
    });

    const matchedAddressName = getByText('Test Account');
    const matchedAddress = getByText(
      '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    );
    const avatar = container.querySelector('svg');

    expect(matchedAddressName).toBeDefined();
    expect(matchedAddress).toBeDefined();
    expect(avatar).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('renders avatar when displayAvatar is true', () => {
    const testAddress = '0xabcd5d886577d5081b0c52e242ef29e70be3e7bc';

    const { container, getByDisplayValue } = createSnapInterfaceRenderer(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
          displayAvatar: true,
        }),
      }),
      { state: { input: `eip155:0:${testAddress}` } },
    );

    const matchedAddress = getByDisplayValue(testAddress);
    const avatar = container.querySelector('svg');

    expect(matchedAddress).toBeDefined();
    expect(avatar).toBeDefined();
    expect(container).toMatchSnapshot();
  });
});