/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { IconName } from '..';
import { Button } from './button';
import { ButtonSize, ButtonVariant } from '.';

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
        <Button
          variant={ButtonVariant.Primary}
          data-testid={ButtonVariant.Primary}
        >
          Button
        </Button>
        <Button
          variant={ButtonVariant.Secondary}
          data-testid={ButtonVariant.Secondary}
        >
          Button
        </Button>
        <Button variant={ButtonVariant.Link} data-testid={ButtonVariant.Link}>
          Button
        </Button>
      </>,
    );
    expect(getByTestId(ButtonVariant.Primary)).toHaveClass(
      `mm-button-${ButtonVariant.Primary}`,
    );
    expect(getByTestId(ButtonVariant.Secondary)).toHaveClass(
      `mm-button-${ButtonVariant.Secondary}`,
    );
    expect(getByTestId(ButtonVariant.Link)).toHaveClass(
      `mm-button-${ButtonVariant.Link}`,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <Button
          variant={ButtonVariant.Link}
          size={ButtonSize.Inherit}
          data-testid={ButtonSize.Inherit}
        >
          Button {ButtonSize.Inherit}
        </Button>
        <Button size={ButtonSize.Sm} data-testid={ButtonSize.Sm}>
          Button {ButtonSize.Sm}
        </Button>
        <Button size={ButtonSize.Md} data-testid={ButtonSize.Md}>
          Button {ButtonSize.Md}
        </Button>
        <Button size={ButtonSize.Lg} data-testid={ButtonSize.Lg}>
          Button {ButtonSize.Lg}
        </Button>
      </>,
    );
    expect(getByTestId(ButtonSize.Inherit)).toHaveClass(
      `mm-button-link--size-${ButtonSize.Inherit}`,
    );
    expect(getByTestId(ButtonSize.Sm)).toHaveClass(
      `mm-button-base--size-${ButtonSize.Sm}`,
    );
    expect(getByTestId(ButtonSize.Md)).toHaveClass(
      `mm-button-base--size-${ButtonSize.Md}`,
    );
    expect(getByTestId(ButtonSize.Lg)).toHaveClass(
      `mm-button-base--size-${ButtonSize.Lg}`,
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
        startIconName={IconName.AddSquare}
        startIconProps={{ 'data-testid': 'start-button-icon' }}
      >
        Button
      </Button>,
    );

    expect(getByTestId('start-button-icon')).toBeDefined();
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
