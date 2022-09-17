/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_SIZES } from '../../../helpers/constants/design-system';
import { ButtonBase } from './button-base';

describe('ButtonBase', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonBase data-testid="button-base" />,
    );
    expect(getByTestId('button-base')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-base')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonBase as="a" data-testid="button-base" />,
    );
    expect(getByTestId('button-base')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-base')).toHaveClass('mm-button');
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonBase block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`box--display-block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase
          size={BUTTON_SIZES.ZERO_PADDING}
          data-testid={BUTTON_SIZES.ZERO_PADDING}
        />
        <ButtonBase size={BUTTON_SIZES.SM} data-testid={BUTTON_SIZES.SM} />
        <ButtonBase size={BUTTON_SIZES.MD} data-testid={BUTTON_SIZES.MD} />
        <ButtonBase size={BUTTON_SIZES.LG} data-testid={BUTTON_SIZES.LG} />
      </>,
    );
    expect(getByTestId(BUTTON_SIZES.ZERO_PADDING)).toHaveClass(
      `mm-button-size--${BUTTON_SIZES.ZERO_PADDING}`,
    );
    expect(getByTestId(BUTTON_SIZES.SM)).toHaveClass(
      `mm-button-size--${BUTTON_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_SIZES.MD)).toHaveClass(
      `mm-button-size--${BUTTON_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_SIZES.LG)).toHaveClass(
      `mm-button-size--${BUTTON_SIZES.LG}`,
    );
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase loading data-testid="loading" />
        <ButtonBase disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
});
