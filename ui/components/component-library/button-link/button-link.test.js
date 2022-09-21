/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import {
  BUTTON_TYPES,
  BUTTON_SIZES,
} from '../../../helpers/constants/design-system';
import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonLink data-testid="button-link" />,
    );
    expect(getByTestId('button-link')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-link')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonLink as="a" data-testid="button-link" />,
    );
    expect(getByTestId('button-link')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-link')).toHaveClass('mm-button');
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonLink block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`box--display-block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonLink size={BUTTON_SIZES.AUTO} data-testid={BUTTON_SIZES.AUTO} />
        <ButtonLink size={BUTTON_SIZES.SM} data-testid={BUTTON_SIZES.SM} />
        <ButtonLink size={BUTTON_SIZES.MD} data-testid={BUTTON_SIZES.MD} />
        <ButtonLink size={BUTTON_SIZES.LG} data-testid={BUTTON_SIZES.LG} />
      </>,
    );
    expect(getByTestId(BUTTON_SIZES.AUTO)).toHaveClass(
      `mm-button-size--${BUTTON_SIZES.AUTO}`,
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

  it('should render with different types', () => {
    const { getByTestId } = render(
      <>
        <ButtonLink
          type={BUTTON_TYPES.NORMAL}
          data-testid={BUTTON_TYPES.NORMAL}
        />
        <ButtonLink
          type={BUTTON_TYPES.DANGER}
          data-testid={BUTTON_TYPES.DANGER}
        />
      </>,
    );

    expect(getByTestId(BUTTON_TYPES.NORMAL)).toHaveClass(
      `mm-button-link--type-${BUTTON_TYPES.NORMAL}`,
    );
    expect(getByTestId(BUTTON_TYPES.DANGER)).toHaveClass(
      `mm-button-link--type-${BUTTON_TYPES.DANGER}`,
    );
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        {/* <ButtonLink loading data-testid="loading" /> */}
        <ButtonLink disabled data-testid="disabled" />
      </>,
    );
    // expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
  it('should render with icon', () => {
    const { container } = render(
      <ButtonLink data-testid="icon" icon="add-square-filled" />,
    );

    const icons = container.getElementsByClassName('icon').length;
    expect(icons).toBe(1);
  });
});
