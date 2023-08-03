/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { IconColor } from '../../../helpers/constants/design-system';
import { IconName } from '..';
import { ButtonIconSize } from './button-icon.types';
import { ButtonIcon } from './button-icon';

describe('ButtonIcon', () => {
  it('should render button element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonIcon
        data-testid="button-icon"
        iconName={IconName.AddSquare}
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
        iconName={IconName.AddSquare}
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
        iconName={IconName.AddSquare}
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
          iconName={IconName.AddSquare}
          ariaLabel="add"
          size={ButtonIconSize.Sm}
          data-testid={ButtonIconSize.Sm}
        />
        <ButtonIcon
          iconName={IconName.AddSquare}
          ariaLabel="add"
          size={ButtonIconSize.Md}
          data-testid={ButtonIconSize.Md}
        />
        <ButtonIcon
          iconName={IconName.AddSquare}
          ariaLabel="add"
          size={ButtonIconSize.Lg}
          data-testid={ButtonIconSize.Lg}
        />
      </>,
    );
    expect(getByTestId(ButtonIconSize.Sm)).toHaveClass(
      `mm-button-icon--size-${ButtonIconSize.Sm}`,
    );
    expect(getByTestId(ButtonIconSize.Md)).toHaveClass(
      `mm-button-icon--size-${ButtonIconSize.Md}`,
    );
    expect(getByTestId(ButtonIconSize.Lg)).toHaveClass(
      `mm-button-icon--size-${ButtonIconSize.Lg}`,
    );
  });

  it('should render with different colors', () => {
    const { getByTestId } = render(
      <>
        <ButtonIcon
          iconName={IconName.AddSquare}
          ariaLabel="add"
          color={IconColor.iconDefault}
          data-testid={IconColor.iconDefault}
        />
        <ButtonIcon
          iconName={IconName.AddSquare}
          ariaLabel="add"
          color={IconColor.errorDefault}
          data-testid={IconColor.errorDefault}
        />
      </>,
    );
    expect(getByTestId(IconColor.iconDefault)).toHaveClass(
      `mm-box--color-${IconColor.iconDefault}`,
    );
    expect(getByTestId(IconColor.errorDefault)).toHaveClass(
      `mm-box--color-${IconColor.errorDefault}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonIcon
        data-testid="classname"
        className="mm-button-icon--test"
        iconName={IconName.AddSquare}
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
          iconName={IconName.AddSquare}
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
        iconName={IconName.AddSquare}
        ariaLabel="add"
        iconProps={{ 'data-testid': 'button-icon' }}
      />,
    );

    expect(getByTestId('button-icon')).toBeDefined();
  });

  it('should render with aria-label', () => {
    const { getByLabelText } = render(
      <ButtonIcon iconName={IconName.AddSquare} ariaLabel="add" />,
    );

    expect(getByLabelText('add')).toBeDefined();
  });
});
