/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { ButtonPrimary } from './button-primary';
import { BUTTON_PRIMARY_SIZES } from './button-primary.constants';

describe('ButtonPrimary', () => {
  it('should render button element correctly', () => {
    const { getByText, getByTestId, container } = render(
      <ButtonPrimary data-testid="button-primary">
        Button Primary
      </ButtonPrimary>,
    );
    expect(getByText('Button Primary')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-primary')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonPrimary as="a" data-testid="button-primary" />,
    );
    expect(getByTestId('button-primary')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonPrimary block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonPrimary data-testid="classname" className="mm-button--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button--test');
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.SM}
          data-testid={BUTTON_PRIMARY_SIZES.SM}
        />
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.MD}
          data-testid={BUTTON_PRIMARY_SIZES.MD}
        />
        <ButtonPrimary
          size={BUTTON_PRIMARY_SIZES.LG}
          data-testid={BUTTON_PRIMARY_SIZES.LG}
        />
      </>,
    );

    expect(getByTestId(BUTTON_PRIMARY_SIZES.SM)).toHaveClass(
      `mm-button-base--size-${BUTTON_PRIMARY_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_PRIMARY_SIZES.MD)).toHaveClass(
      `mm-button-base--size-${BUTTON_PRIMARY_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_PRIMARY_SIZES.LG)).toHaveClass(
      `mm-button-base--size-${BUTTON_PRIMARY_SIZES.LG}`,
    );
  });

  it('should render as danger', () => {
    const { getByTestId } = render(
      <>
        <ButtonPrimary danger data-testid="danger" />
      </>,
    );

    expect(getByTestId('danger')).toHaveClass('mm-button-primary--type-danger');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonPrimary loading data-testid="loading" />
        <ButtonPrimary disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });
  it('should render with icon', () => {
    const { container } = render(
      <ButtonPrimary data-testid="icon" iconName="add-square-filled" />,
    );

    const icons = container.getElementsByClassName('mm-icon').length;
    expect(icons).toBe(1);
  });
});
