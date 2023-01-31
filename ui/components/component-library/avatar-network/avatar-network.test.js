/* eslint-disable jest/require-top-level-describe */
import { render, screen } from '@testing-library/react';
import React from 'react';

import { COLORS } from '../../../helpers/constants/design-system';

import { AvatarNetwork } from './avatar-network';

describe('AvatarNetwork', () => {
  const args = {
    name: 'ethereum',
    src: './images/eth_logo.svg',
    showHalo: false,
  };

  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <AvatarNetwork data-testid="avatar-network" />,
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
      <AvatarNetwork data-testid="avatar-network" className="test-class" />,
    );
    expect(getByTestId('avatar-network')).toHaveClass('test-class');
  });
  // color
  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          color={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarNetwork
          color={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--color-${COLORS.ERROR_DEFAULT}`,
    );
  });
  // background color
  it('should render with different background colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          backgroundColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarNetwork
          backgroundColor={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--background-color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--background-color-${COLORS.ERROR_DEFAULT}`,
    );
  });
  // border color
  it('should render with different border colors', () => {
    const { getByTestId } = render(
      <>
        <AvatarNetwork
          borderColor={COLORS.SUCCESS_DEFAULT}
          data-testid={COLORS.SUCCESS_DEFAULT}
        />
        <AvatarNetwork
          borderColor={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.SUCCESS_DEFAULT)).toHaveClass(
      `box--border-color-${COLORS.SUCCESS_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--border-color-${COLORS.ERROR_DEFAULT}`,
    );
  });
});
