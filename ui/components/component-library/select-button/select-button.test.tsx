import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { AvatarAccount, AvatarAccountSize, SelectWrapper } from '..';
import { SelectButton, SelectButtonSize } from '.';

describe('SelectButton', () => {
  it('renders without crashing', () => {
    const { getByText, container } = render(
      <SelectButton label="Test Button" />,
    );
    expect(getByText('Test Button')).toBeInTheDocument();
    expect(container).toMatchSnapshot();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    const { getByText } = render(
      <SelectButton label="Test Button" onClick={handleClick} />,
    );
    fireEvent.click(getByText('Test Button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders with additional className', () => {
    const { getByTestId } = render(
      <SelectButton
        label="Test Button"
        data-testid="button"
        className="mm-select-button--test"
      />,
    );
    expect(getByTestId('button')).toHaveClass('mm-select-button--test');
  });

  it('renders with different sizes', () => {
    const { rerender, getByTestId } = render(
      <SelectButton
        label="Test Button"
        size={SelectButtonSize.Sm}
        data-testid="button"
      />,
    );
    expect(getByTestId('button')).toHaveClass('mm-select-button--size-sm');

    rerender(
      <SelectButton
        label="Test Button"
        size={SelectButtonSize.Md}
        data-testid="button"
      />,
    );
    expect(getByTestId('button')).toHaveClass('mm-select-button--size-md');

    rerender(
      <SelectButton
        label="Test Button"
        size={SelectButtonSize.Lg}
        data-testid="button"
      />,
    );
    expect(getByTestId('button')).toHaveClass('mm-select-button--size-lg');
  });

  it('renders with start and end accessories', () => {
    const { getByText } = render(
      <SelectButton
        label="Test Button"
        startAccessory={<div>Start</div>}
        endAccessory={<div>End</div>}
      />,
    );
    expect(getByText('Start')).toBeInTheDocument();
    expect(getByText('End')).toBeInTheDocument();
  });

  it('renders with a description', () => {
    const { getByText } = render(
      <SelectButton
        label="Test Button"
        description="This is a test description"
      />,
    );
    expect(getByText('This is a test description')).toBeInTheDocument();
  });

  it('renders as disabled', () => {
    const { getByTestId } = render(
      <SelectButton
        label="Test Button"
        data-testid="button"
        isDisabled={true}
      />,
    );
    expect(getByTestId('button')).toBeDisabled();
  });

  it('renders as danger', () => {
    const { getByTestId } = render(
      <SelectButton label="Test Button" isDanger={true} data-testid="button" />,
    );
    expect(getByTestId('button')).toHaveClass('mm-select-button--type-danger');
  });

  it('renders with a value using prop recommendation object', () => {
    const { getByText, getByTestId } = render(
      <SelectButton
        value={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="start-accessory"
            />
          ),
          label: 'Label here',
          description: 'Description here',
          endAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="end-accessory"
            />
          ),
        }}
      />,
    );
    expect(getByText('Label here')).toBeInTheDocument();
    expect(getByText('Description here')).toBeInTheDocument();
    expect(getByTestId('start-accessory')).toBeInTheDocument();
    expect(getByTestId('end-accessory')).toBeInTheDocument();
  });
  it('renders with a defaultValue using prop recommendation object', () => {
    const { getByText, getByTestId } = render(
      <SelectButton
        defaultValue={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="start-accessory"
            />
          ),
          label: 'Label here',
          description: 'Description here',
          endAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="end-accessory"
            />
          ),
        }}
      />,
    );
    expect(getByText('Label here')).toBeInTheDocument();
    expect(getByText('Description here')).toBeInTheDocument();
    expect(getByTestId('start-accessory')).toBeInTheDocument();
    expect(getByTestId('end-accessory')).toBeInTheDocument();
  });

  it('renders with a placeholder using prop recommendation object', () => {
    const { getByText, getByTestId } = render(
      <SelectButton
        placeholder={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="start-accessory"
            />
          ),
          label: 'Label here',
          description: 'Description here',
          endAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="end-accessory"
            />
          ),
        }}
      />,
    );
    expect(getByText('Label here')).toBeInTheDocument();
    expect(getByText('Description here')).toBeInTheDocument();
    expect(getByTestId('start-accessory')).toBeInTheDocument();
    expect(getByTestId('end-accessory')).toBeInTheDocument();
  });
  it('renders wrapped by SelectWrapper with a placeholder set at the SelectWrapper using prop recommendation object', () => {
    const { getByText, getByTestId } = render(
      <SelectWrapper
        placeholder={{
          startAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="start-accessory"
            />
          ),
          label: 'Label here',
          description: 'Description here',
          endAccessory: (
            <AvatarAccount
              address="0x5CfE73b6021E818B776b421B1c4Db2474086a7e1"
              size={AvatarAccountSize.Sm}
              data-testid="end-accessory"
            />
          ),
        }}
        triggerComponent={<SelectButton />}
      ></SelectWrapper>,
    );
    expect(getByText('Label here')).toBeInTheDocument();
    expect(getByText('Description here')).toBeInTheDocument();
    expect(getByTestId('start-accessory')).toBeInTheDocument();
    expect(getByTestId('end-accessory')).toBeInTheDocument();
  });
});
