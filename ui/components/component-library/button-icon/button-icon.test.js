/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { COLORS } from '../../../helpers/constants/design-system';
import { ICON_NAMES } from '..';
import { BUTTON_ICON_SIZES } from './button-icon.constants';
import { ButtonIcon } from './button-icon';

describe('ButtonIcon', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon
        data-testid="button-icon"
        iconName={ICON_NAMES.ADD_SQUARE}
        ariaLabel="add"
      />,
    );
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-icon')).toHaveClass('mm-button-icon');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon
        as="a"
        data-testid="button-icon"
        iconName={ICON_NAMES.ADD_SQUARE}
        ariaLabel="add"
      />,
    );
    expect(getByTestId('button-icon')).toHaveClass('mm-button-icon');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly using href', () => {
    const { getByTestId, getByRole } = render(
      <ButtonIcon
        href="/metamask"
        data-testid="button-icon"
        iconName={ICON_NAMES.ADD_SQUARE}
        ariaLabel="add"
      />,
    );
    expect(getByTestId('button-icon')).toHaveClass('mm-button-icon');
    expect(getByRole('link')).toBeDefined();
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          iconName={ICON_NAMES.ADD_SQUARE}
          ariaLabel="add"
          size={BUTTON_ICON_SIZES.SM}
          data-testid={BUTTON_ICON_SIZES.SM}
        />
        <ButtonIcon
          iconName={ICON_NAMES.ADD_SQUARE}
          ariaLabel="add"
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

  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          iconName={ICON_NAMES.ADD_SQUARE}
          ariaLabel="add"
          color={COLORS.ICON_DEFAULT}
          data-testid={COLORS.ICON_DEFAULT}
        />
        <ButtonIcon
          iconName={ICON_NAMES.ADD_SQUARE}
          ariaLabel="add"
          color={COLORS.ERROR_DEFAULT}
          data-testid={COLORS.ERROR_DEFAULT}
        />
      </>,
    );
    expect(getByTestId(COLORS.ICON_DEFAULT)).toHaveClass(
      `box--color-${COLORS.ICON_DEFAULT}`,
    );
    expect(getByTestId(COLORS.ERROR_DEFAULT)).toHaveClass(
      `box--color-${COLORS.ERROR_DEFAULT}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonIcon
        data-testid="classname"
        className="mm-button-icon--test"
        iconName={ICON_NAMES.ADD_SQUARE}
        ariaLabel="add"
      />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button-icon--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          disabled
          data-testid="disabled"
          iconName={ICON_NAMES.ADD_SQUARE}
          ariaLabel="add"
        />
      </>,
    );

    expect(getByTestId('disabled')).toHaveClass(`mm-button-icon--disabled`);
    expect(getByTestId('disabled')).toBeDisabled();
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <ButtonIcon
        data-testid="icon"
        iconName={ICON_NAMES.ADD_SQUARE}
        ariaLabel="add"
        iconProps={{ 'data-testid': 'button-icon' }}
      />,
    );

    expect(getByTestId('button-icon')).toBeDefined();
  });

  it('should render with aria-label', () => {
    const { getByLabelText } = render(
      <ButtonIcon iconName={ICON_NAMES.ADD_SQUARE} ariaLabel="add" />,
    );

    expect(getByLabelText('add')).toBeDefined();
  });
});
