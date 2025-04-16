import { Box, AddressInput, Field } from '@metamask/snaps-sdk/jsx';
import { fireEvent } from '@testing-library/react';
import { renderInterface } from '../test-utils';

describe('SnapUIAddressInput', () => {
  it('will render', () => {
    const { container, getByRole } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toStrictEqual('');

    expect(container).toMatchSnapshot();
  });

  it('supports existing state', () => {
    const { getByRole } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
      {
        state: { input: 'eip155:0:0x1234567890123456789012345678901234567890' },
      },
    );

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.value).toStrictEqual(
      '0x1234567890123456789012345678901234567890',
    );
  });

  it('supports a placeholder', () => {
    const { getByRole } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          placeholder: 'Enter an address',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input.placeholder).toStrictEqual('Enter an address');
  });

  it('supports the disabled prop', () => {
    const { getByRole } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          disabled: true,
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    expect(input).toBeDisabled();
  });

  it('will render within a field', () => {
    const { getByRole, getByText } = renderInterface(
      Box({
        children: [
          Field({
            label: 'Address',
            children: AddressInput({
              name: 'input',
              chainId: 'eip155:0',
            }),
          }),
        ],
      }),
    );

    const input = getByRole('textbox') as HTMLInputElement;
    expect(input).toBeDefined();
    const label = getByText('Address');
    expect(label).toBeDefined();
  });

  it('will render a matched address name', () => {
    const { container, getByRole, getByText } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
        }),
      }),
    );

    const input = getByRole('textbox') as HTMLInputElement;
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

  it('will render avatar when displayAvatar is true', () => {
    const testAddress = '0xabcd5d886577d5081b0c52e242ef29e70be3e7bc';

    const { container, getByDisplayValue } = renderInterface(
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
    expect(matchedAddress).toBeDefined();
    const avatar = container.querySelector('svg');
    expect(avatar).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('will not render avatar when displayAvatar is false', () => {
    const testAddress = '0xabcd5d886577d5081b0c52e242ef29e70be3e7bc';

    const { container, getByDisplayValue } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
          displayAvatar: false,
        }),
      }),
      { state: { input: `eip155:0:${testAddress}` } },
    );

    const matchedAddress = getByDisplayValue(testAddress);
    expect(matchedAddress).toBeDefined();
    const avatar = container.querySelector('svg');
    expect(avatar).toBeNull();
    expect(container).toMatchSnapshot();
  });

  it('renders with an invalid CAIP Account ID', () => {
    const testAddress = 'https://foobar.baz/foobar';

    const { container, getByRole } = renderInterface(
      Box({
        children: AddressInput({
          name: 'input',
          chainId: 'eip155:0',
          displayAvatar: false,
        }),
      }),
      { state: { input: null } },
    );

    const input = getByRole('textbox') as HTMLInputElement;
    fireEvent.change(input, { target: { value: testAddress } });
    expect(container).toMatchSnapshot();
  });
});
