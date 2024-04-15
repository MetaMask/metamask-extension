/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import {
  BackgroundColor,
  BorderColor,
  TextColor,
} from '../../../helpers/constants/design-system';

import { AvatarNetwork, AvatarNetworkSize } from '.';

describe('AvatarNetwork', () => {
  const args = {
    name: 'ethereum',
    src: './images/eth_logo.svg',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarNetwork {...args} data-testid="avatar-network" />,
    );
    expect(getByTestId('avatar-network')).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render image of Avatar Network', () => {
    render(<AvatarNetwork data-testid="avatar-network" {...args} />);
    const image = screen.getByRole('img');
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.src);
  });

  it('should render the first letter of the name prop if no src is provided', () => {
    const { getByText } = render(
      <AvatarNetwork data-testid="avatar-network" {...args} src="" />,
    );
    expect(getByText('e')).toBeDefined();
  });

  it('should render halo effect if showHalo is true and image url is there', () => {
    render(<AvatarNetwork data-testid="avatar-network" {...args} showHalo />);
    const image = screen.getAllByRole('img', { hidden: true });
    expect(image[1]).toHaveClass(
      'mm-avatar-network__network-image--size-reduced',
    );
  });

  it('should render the first letter of the name prop when showHalo is true and no image url is provided', () => {
    const { getByText } = render(
      <AvatarNetwork {...args} src="" data-testid="avatar-network" showHalo />,
    );
    expect(getByText('e')).toBeDefined();
  });
  // className
  it('should render with custom className', () => {
    const { getByTestId } = render(
      <AvatarNetwork
        {...args}
        data-testid="avatar-network"
        className="test-class"
      />,
    );
    expect(getByTestId('avatar-network')).toHaveClass('test-class');
  });
  // color
  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          {...args}
          color={TextColor.successDefault}
          data-testid={TextColor.successDefault}
        />
        <AvatarNetwork
          {...args}
          color={TextColor.errorDefault}
          data-testid={TextColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(TextColor.successDefault)).toHaveClass(
      `mm-box--color-${TextColor.successDefault}`,
    );
    expect(getByTestId(TextColor.errorDefault)).toHaveClass(
      `mm-box--color-${TextColor.errorDefault}`,
    );
  });
  // background color
  it('should render with different background colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          {...args}
          backgroundColor={BackgroundColor.successDefault}
          data-testid={BackgroundColor.successDefault}
        />
        <AvatarNetwork
          {...args}
          backgroundColor={BackgroundColor.errorDefault}
          data-testid={BackgroundColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(BackgroundColor.successDefault)).toHaveClass(
      `mm-box--background-color-${BackgroundColor.successDefault}`,
    );
    expect(getByTestId(BackgroundColor.errorDefault)).toHaveClass(
      `mm-box--background-color-${BackgroundColor.errorDefault}`,
    );
  });
  // border color
  it('should render with different border colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          {...args}
          borderColor={BorderColor.successDefault}
          data-testid={BorderColor.successDefault}
        />
        <AvatarNetwork
          {...args}
          borderColor={BorderColor.errorDefault}
          data-testid={BorderColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(BorderColor.successDefault)).toHaveClass(
      `mm-box--border-color-${BorderColor.successDefault}`,
    );
    expect(getByTestId(BorderColor.errorDefault)).toHaveClass(
      `mm-box--border-color-${BorderColor.errorDefault}`,
    );
  });
  // AvatarNetworkSize
  it('should render with different AvatarNetworkSize', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          {...args}
          size={AvatarNetworkSize.Xs}
          data-testid={AvatarNetworkSize.Xs}
        />
        <AvatarNetwork
          {...args}
          size={AvatarNetworkSize.Sm}
          data-testid={AvatarNetworkSize.Sm}
        />
        <AvatarNetwork
          {...args}
          size={AvatarNetworkSize.Md}
          data-testid={AvatarNetworkSize.Md}
        />
        <AvatarNetwork
          {...args}
          size={AvatarNetworkSize.Lg}
          data-testid={AvatarNetworkSize.Lg}
        />
        <AvatarNetwork
          {...args}
          size={AvatarNetworkSize.Xl}
          data-testid={AvatarNetworkSize.Xl}
        />
      </>,
    );
    expect(getByTestId(AvatarNetworkSize.Xs)).toHaveClass(
      `mm-avatar-base--size-${AvatarNetworkSize.Xs}`,
    );
    expect(getByTestId(AvatarNetworkSize.Sm)).toHaveClass(
      `mm-avatar-base--size-${AvatarNetworkSize.Sm}`,
    );
    expect(getByTestId(AvatarNetworkSize.Md)).toHaveClass(
      `mm-avatar-base--size-${AvatarNetworkSize.Md}`,
    );
    expect(getByTestId(AvatarNetworkSize.Lg)).toHaveClass(
      `mm-avatar-base--size-${AvatarNetworkSize.Lg}`,
    );
    expect(getByTestId(AvatarNetworkSize.Xl)).toHaveClass(
      `mm-avatar-base--size-${AvatarNetworkSize.Xl}`,
    );
  });
  it('should forward a ref to the root html element', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<AvatarNetwork {...args} ref={ref} />);
    expect(ref.current).not.toBeNull();
    if (ref.current) {
      expect(ref.current.nodeName).toBe('DIV');
    }
  });
});
