import { render, screen } from '@testing-library/react';
import React from 'react';

import { IconName } from '../icon';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import configureStore from '../../../store/store';
import { AvatarType } from '../../multichain/avatar-group/avatar-group.types';
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
        src="./images/pol-token.svg"
      />,
    );
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', './images/pol-token.svg');
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
          name: IconName.ArrowDown,
        }}
      />
    );

    expect(container.props.iconProps.name).toStrictEqual(IconName.ArrowDown);
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
  // avatarGroupProps
  it('should render multiple avatars when avatarGroupProps is present', () => {
    const { container } = renderWithProvider(
      <PickerNetwork
        data-testid="picker-network"
        label="test"
        avatarGroupProps={{
          members: [
            { avatarValue: 'img1', symbol: 'Network1' },
            { avatarValue: 'img2', symbol: 'Network3' },
            { avatarValue: 'img3', symbol: 'Network4' },
            { avatarValue: 'img4', symbol: 'Network4' },
          ],
          limit: 2,
          avatarType: AvatarType.NETWORK,
        }}
      />,
      configureStore({ metamask: { useBlockie: false } }),
    );
    expect(container).toMatchSnapshot();
  });
  it('should render multiple avatars with a stacked tag when isTagOverlay is present', () => {
    const { container } = renderWithProvider(
      <PickerNetwork
        data-testid="picker-network"
        label="test"
        avatarGroupProps={{
          members: [
            { avatarValue: 'img1', symbol: 'Network1' },
            { avatarValue: 'img2', symbol: 'Network3' },
            { avatarValue: 'img3', symbol: 'Network4' },
            { avatarValue: 'img4', symbol: 'Network4' },
          ],
          limit: 2,
          isTagOverlay: true,
          avatarType: AvatarType.NETWORK,
        }}
      />,
      configureStore({ metamask: { useBlockie: true } }),
    );
    expect(container).toMatchSnapshot();
  });
});
