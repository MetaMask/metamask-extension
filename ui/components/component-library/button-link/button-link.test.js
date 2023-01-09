/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { SIZES } from '../../../helpers/constants/design-system';
import { ButtonLink } from './button-link';

describe('ButtonLink', () => {
  it('should render button element correctly', () => {
    const { getByText, getByTestId, container } = render(
      <ButtonLink data-testid="button-link">Button Link</ButtonLink>,
    );
    expect(getByText('Button Link')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-link')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonLink block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonLink data-testid="classname" className="mm-button--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button--test');
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonLink size={SIZES.SM} data-testid={SIZES.SM} />
        <ButtonLink size={SIZES.MD} data-testid={SIZES.MD} />
        <ButtonLink size={SIZES.LG} data-testid={SIZES.LG} />
        <ButtonLink size={SIZES.AUTO} data-testid={SIZES.AUTO} />
      </>,
    );

    expect(getByTestId(SIZES.SM)).toHaveClass(
      `mm-button-base--size-${SIZES.SM}`,
    );
    expect(getByTestId(SIZES.MD)).toHaveClass(
      `mm-button-base--size-${SIZES.MD}`,
    );
    expect(getByTestId(SIZES.LG)).toHaveClass(
      `mm-button-base--size-${SIZES.LG}`,
    );
    expect(getByTestId(SIZES.AUTO)).toHaveClass(
      `mm-button-link--size-${SIZES.AUTO}`,
    );
  });

  it('should render as danger', () => {
    const { getByTestId } = render(
      <>
        <ButtonLink danger data-testid="danger" />
      </>,
    );

    expect(getByTestId('danger')).toHaveClass('mm-button-link--type-danger');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonLink loading data-testid="loading" />
        <ButtonLink disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });

  it('should render with icon', () => {
    const { container } = render(
      <ButtonLink data-testid="icon" iconName="add-square-filled" />,
    );

    const icons = container.getElementsByClassName('mm-icon').length;
    expect(icons).toBe(1);
  });

  it('should render anchor element correctly', () => {
    const { getByRole } = render(
      <ButtonLink as="a" href="https://www.test.com" />,
    );
    expect(getByRole('link')).toHaveAttribute('href', 'https://www.test.com');
  });

  it('should render anchor element correctly by href only being passed and href exists', () => {
    const { getByRole } = render(
      <ButtonLink href="https://www.test.com">Button Base</ButtonLink>,
    );
    expect(getByRole('link')).toHaveAttribute('href', 'https://www.test.com');
  });
});
