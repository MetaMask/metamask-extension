/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
import { ButtonIcon } from './button-icon';

describe('ButtonIcon', () => {
  it('should render button element correctly', () => {
    const { getByTestId, getByText, container } = render(
      <ButtonIcon data-testid="button-icon">Button icon</ButtonIcon>,
    );
    expect(getByText('Button icon')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-icon')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon as="a" data-testid="button-icon" />,
    );
    expect(getByTestId('button-icon')).toHaveClass('mm-button');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonIcon block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button--block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          size={BUTTON_ICON_SIZES.AUTO}
          data-testid={BUTTON_ICON_SIZES.AUTO}
        />
        <ButtonIcon
          size={BUTTON_ICON_SIZES.SM}
          data-testid={BUTTON_ICON_SIZES.SM}
        />
        <ButtonIcon
          size={BUTTON_ICON_SIZES.MD}
          data-testid={BUTTON_ICON_SIZES.MD}
        />
        <ButtonIcon
          size={BUTTON_ICON_SIZES.LG}
          data-testid={BUTTON_ICON_SIZES.LG}
        />
      </>,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.AUTO)).toHaveClass(
      `mm-button--size-${BUTTON_ICON_SIZES.AUTO}`,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.SM)).toHaveClass(
      `mm-button--size-${BUTTON_ICON_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.MD)).toHaveClass(
      `mm-button--size-${BUTTON_ICON_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.LG)).toHaveClass(
      `mm-button--size-${BUTTON_ICON_SIZES.LG}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonIcon data-testid="classname" className="mm-button--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon disabled data-testid="disabled" />
      </>,
    );

    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <ButtonIcon
        data-testid="icon"
        icon="add-square-filled"
        iconProps={{ 'data-testid': 'button-icon' }}
      />,
    );

    expect(getByTestId('button-icon')).toBeDefined();
  });
});
