/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { IconColor } from '../../../helpers/constants/design-system';
import { IconName, IconSize } from './icon.types';
import { Icon } from './icon';

describe('Icon', () => {
  it('should render correctly', () => {
    const { getByTestId, container } = render(
      <Icon name={IconName.AddSquare} data-testid="icon" />,
    );
    expect(getByTestId('icon')).toBeDefined();
    expect(container.querySelector('svg')).toBeDefined();
    expect(container).toMatchSnapshot();
  });
  it('should render with a custom class', () => {
    const { getByTestId } = render(
      <Icon
        name={IconName.AddSquare}
        data-testid="icon"
        className="test-class"
      />,
    );
    expect(getByTestId('icon')).toHaveClass('test-class');
  });
  it('should render with an aria-label attribute', () => {
    /**
     * We aren't specifically adding an ariaLabel prop because in most cases
     * the icon should be decorative or be accompanied by text. Also if the icon
     * is to be used as a button in most cases ButtonIcon should be used. However
     * we should test if it's possible to pass an aria-label attribute to the
     * root html element.
     */
    const { getByTestId } = render(
      <Icon
        name={IconName.AddSquare}
        data-testid="icon"
        aria-label="test aria label"
      />,
    );
    expect(getByTestId('icon')).toHaveAttribute(
      'aria-label',
      'test aria label',
    );
  });
  it('should render with different icons using mask-image and image urls', () => {
    const { getByTestId } = render(
      <>
        <Icon name={IconName.AddSquare} data-testid="add-square" />
        <Icon name={IconName.Bank} data-testid="bank" />
        <Icon name={IconName.Bookmark} data-testid="bookmark" />
        <Icon name={IconName.Calculator} data-testid="calculator" />
      </>,
    );
    expect(window.getComputedStyle(getByTestId('add-square')).maskImage).toBe(
      `url('./images/icons/add-square.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('bank')).maskImage).toBe(
      `url('./images/icons/bank.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('bookmark')).maskImage).toBe(
      `url('./images/icons/bookmark.svg')`,
    );
    expect(window.getComputedStyle(getByTestId('calculator')).maskImage).toBe(
      `url('./images/icons/calculator.svg')`,
    );
  });
  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Xs}
          data-testid="icon-xs"
        />
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Sm}
          data-testid="icon-sm"
        />
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Md}
          data-testid="icon-md"
        />
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Lg}
          data-testid="icon-lg"
        />
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Xl}
          data-testid="icon-xl"
        />
        <Icon
          name={IconName.AddSquare}
          size={IconSize.Inherit}
          data-testid="icon-inherit"
        />
      </>,
    );
    expect(getByTestId('icon-xs')).toHaveClass('mm-icon--size-xs');
    expect(getByTestId('icon-sm')).toHaveClass('mm-icon--size-sm');
    expect(getByTestId('icon-md')).toHaveClass('mm-icon--size-md');
    expect(getByTestId('icon-lg')).toHaveClass('mm-icon--size-lg');
    expect(getByTestId('icon-xl')).toHaveClass('mm-icon--size-xl');
    expect(getByTestId('icon-inherit')).toHaveClass('mm-icon--size-inherit');
  });
  it('should render with icon colors', () => {
    const { getByTestId } = render(
      <>
        <Icon
          name={IconName.AddSquare}
          color={IconColor.iconDefault}
          data-testid="icon-color-default"
        />
        <Icon
          name={IconName.AddSquare}
          color={IconColor.iconAlternative}
          data-testid="icon-color-alternative"
        />
        <Icon
          name={IconName.AddSquare}
          color={IconColor.iconMuted}
          data-testid="icon-color-muted"
        />
      </>,
    );
    expect(getByTestId('icon-color-default')).toHaveClass(
      'mm-box--color-icon-default',
    );
    expect(getByTestId('icon-color-alternative')).toHaveClass(
      'mm-box--color-icon-alternative',
    );
    expect(getByTestId('icon-color-muted')).toHaveClass(
      'mm-box--color-icon-muted',
    );
  });
});
