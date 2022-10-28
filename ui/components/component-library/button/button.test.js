/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_SIZES, BUTTON_TYPES } from './button.constants';
import { Button } from './button';

describe('Button', () => {
  it('should render button element correctly', () => {
    const { getByTestId, getByText, container } = render(
      <Button data-testid="button">Button</Button>,
    );
    expect(getByText('Button')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button')).toHaveClass('mm-button');
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <Button as="a" data-testid="button" />,
    );
    expect(getByTestId('button')).toHaveClass('mm-button');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly by href only being passed', () => {
    const { getByTestId, container } = render(
      <Button href="#" data-testid="button" />,
    );
    expect(getByTestId('button')).toHaveClass('mm-button');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<Button block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button--block`);
  });

  it('should render with different button types', () => {
    const { getByTestId } = render(
      <>
        <Button
          type={BUTTON_TYPES.PRIMARY}
          data-testid={BUTTON_TYPES.PRIMARY}
        />
        <Button
          type={BUTTON_TYPES.SECONDARY}
          data-testid={BUTTON_TYPES.SECONDARY}
        />
        <Button type={BUTTON_TYPES.LINK} data-testid={BUTTON_TYPES.LINK} />
      </>,
    );
    expect(getByTestId(BUTTON_TYPES.PRIMARY)).toHaveClass(
      `mm-button-${BUTTON_TYPES.PRIMARY}`,
    );
    expect(getByTestId(BUTTON_TYPES.SECONDARY)).toHaveClass(
      `mm-button-${BUTTON_TYPES.SECONDARY}`,
    );
    expect(getByTestId(BUTTON_TYPES.LINK)).toHaveClass(
      `mm-button-${BUTTON_TYPES.LINK}`,
    );
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Button
          size={BUTTON_SIZES.AUTO}
          type={BUTTON_TYPES.LINK}
          data-testid={BUTTON_SIZES.AUTO}
        />
        <Button size={BUTTON_SIZES.SM} data-testid={BUTTON_SIZES.SM} />
        <Button size={BUTTON_SIZES.MD} data-testid={BUTTON_SIZES.MD} />
        <Button size={BUTTON_SIZES.LG} data-testid={BUTTON_SIZES.LG} />
      </>,
    );
    expect(getByTestId(BUTTON_SIZES.AUTO)).toHaveClass(
      `mm-button--size-${BUTTON_SIZES.AUTO}`,
    );
    expect(getByTestId(BUTTON_SIZES.SM)).toHaveClass(
      `mm-button--size-${BUTTON_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_SIZES.MD)).toHaveClass(
      `mm-button--size-${BUTTON_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_SIZES.LG)).toHaveClass(
      `mm-button--size-${BUTTON_SIZES.LG}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <Button data-testid="classname" className="mm-button--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <Button loading data-testid="loading" />
        <Button disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button--disabled`);
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <Button
        data-testid="icon"
        icon="add-square-filled"
        iconProps={{ 'data-testid': 'base-button-icon' }}
      />,
    );

    expect(getByTestId('base-button-icon')).toBeDefined();
  });
});

it('should render as danger', () => {
  const { getByTestId } = render(
    <>
      <Button danger data-testid="danger" />
    </>,
  );

  expect(getByTestId('danger')).toHaveClass('mm-button-primary--type-danger');
});
