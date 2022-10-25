/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
import { ButtonIcon } from './button-icon';

describe('ButtonIcon', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon data-testid="button-icon" icon="add-square-filled" />,
    );
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-icon')).toHaveClass('mm-button-icon');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon as="a" data-testid="button-icon" />,
    );
    expect(getByTestId('button-icon')).toHaveClass('mm-button-icon');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          size={BUTTON_ICON_SIZES.SM}
          data-testid={BUTTON_ICON_SIZES.SM}
        />
        <ButtonIcon
          size={BUTTON_ICON_SIZES.LG}
          data-testid={BUTTON_ICON_SIZES.LG}
        />
      </>,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.SM)).toHaveClass(
      `mm-button-icon--size-${BUTTON_ICON_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_ICON_SIZES.LG)).toHaveClass(
      `mm-button-icon--size-${BUTTON_ICON_SIZES.LG}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonIcon data-testid="classname" className="mm-button-icon--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button-icon--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon disabled data-testid="disabled" />
      </>,
    );

    expect(getByTestId('disabled')).toHaveClass(`mm-button-icon--disabled`);
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
