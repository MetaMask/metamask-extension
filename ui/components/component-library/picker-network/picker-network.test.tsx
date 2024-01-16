import { render, screen } from '@testing-library/react';
import React from 'react';

import { PickerNetwork } from './picker-network';

describe('PickerNetwork', () => {
  it('should render the label inside the PickerNetwork', () => {
    const { getByTestId, container } = render(
      <PickerNetwork data-testid="picker-network" label="Imported" />,
    );
    expect(getByTestId('picker-network')).toBeDefined();
    expect(getByTestId('picker-network')).toHaveTextContent('Imported');
    expect(container).toMatchSnapshot();
  });
  it('should render correct Avatar inside Picker Network', () => {
    render(
      <PickerNetwork
        data-testid="picker-network"
        label="Imported"
        src="./images/matic-token.png"
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', './images/matic-token.png');
  });
  it('should render avatar network inside the PickerNetwork with custom props', () => {
    const container = (
      <PickerNetwork
        data-testid="picker-network"
        label="Imported"
        avatarNetworkProps={{
          name: 'matic network',
        }}
      />
    );

    expect(container.props.avatarNetworkProps.name).toStrictEqual(
      'matic network',
    );
  });
  it('should render down arrow icon inside the PickerNetwork with custom props', () => {
    const container = (
      <PickerNetwork
        data-testid="picker-network"
        label="Imported"
        iconProps={{
          name: 'down-arrow-picker-icon',
        }}
      />
    );

    expect(container.props.iconProps.name).toStrictEqual(
      'down-arrow-picker-icon',
    );
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <PickerNetwork
        data-testid="picker-network"
        label="test"
        className="test-class"
      />,
    );
    expect(getByTestId('picker-network')).toHaveClass('test-class');
  });
  it('should render with labelProps', () => {
    const { getByTestId } = render(
      <PickerNetwork
        data-testid="picker-network"
        label="test"
        labelProps={{
          'data-testid': 'picker-network-label',
          className: 'test-class',
        }}
      />,
    );
    expect(getByTestId('picker-network-label')).toHaveClass('test-class');
  });
});
