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
    expect(getByTestId('button')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <Button as="a" data-testid="button">
        Button
      </Button>,
    );
    expect(getByTestId('button')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly by href only being passed', () => {
    const { getByTestId, container } = render(
      <Button href="/metamask" data-testid="button">
        Visit Site
      </Button>,
    );
    expect(getByTestId('button')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<Button block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with different button types', () => {
    const { getByTestId, container } = render(
      <>
        <Button type={BUTTON_TYPES.PRIMARY} data-testid={BUTTON_TYPES.PRIMARY}>
          Button
        </Button>
        <Button
          type={BUTTON_TYPES.SECONDARY}
          data-testid={BUTTON_TYPES.SECONDARY}
        >
          Button
        </Button>
        <Button type={BUTTON_TYPES.LINK} data-testid={BUTTON_TYPES.LINK}>
          Button
        </Button>
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
    expect(container).toMatchSnapshot();
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Button
          size={BUTTON_SIZES.AUTO}
          type={BUTTON_TYPES.LINK}
          data-testid={BUTTON_SIZES.AUTO}
        >
          Button {BUTTON_SIZES.AUTO}
        </Button>
        <Button size={BUTTON_SIZES.SM} data-testid={BUTTON_SIZES.SM}>
          Button {BUTTON_SIZES.SM}
        </Button>
        <Button size={BUTTON_SIZES.MD} data-testid={BUTTON_SIZES.MD}>
          Button {BUTTON_SIZES.MD}
        </Button>
        <Button size={BUTTON_SIZES.LG} data-testid={BUTTON_SIZES.LG}>
          Button {BUTTON_SIZES.LG}
        </Button>
      </>,
    );
    expect(getByTestId(BUTTON_SIZES.AUTO)).toHaveClass(
      `mm-button-base--size-${BUTTON_SIZES.AUTO}`,
    );
    expect(getByTestId(BUTTON_SIZES.SM)).toHaveClass(
      `mm-button-base--size-${BUTTON_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_SIZES.MD)).toHaveClass(
      `mm-button-base--size-${BUTTON_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_SIZES.LG)).toHaveClass(
      `mm-button-base--size-${BUTTON_SIZES.LG}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <Button data-testid="classname" className="mm-button-base--test">
        Button
      </Button>,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button-base--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <Button loading data-testid="loading">
          Button
        </Button>
        <Button disabled data-testid="disabled">
          Button
        </Button>
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <Button
        data-testid="icon"
        iconName="add-square-filled"
        iconProps={{ 'data-testid': 'base-button-icon' }}
      >
        Button
      </Button>,
    );

    expect(getByTestId('base-button-icon')).toBeDefined();
  });
});

it('should render as danger', () => {
  const { getByTestId } = render(
    <>
      <Button danger data-testid="danger">
        Button Danger
      </Button>
    </>,
  );

  expect(getByTestId('danger')).toHaveClass('mm-button-primary--type-danger');
});
