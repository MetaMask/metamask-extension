/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { BUTTON_BASE_SIZES } from './button-base.constants';
import { ButtonBase } from './button-base';

describe('ButtonBase', () => {
  it('should render button element correctly and match snapshot', () => {
    const { getByTestId, getByText, container } = render(
      <ButtonBase data-testid="button-base">Button base</ButtonBase>,
    );
    expect(getByText('Button base')).toBeDefined();
    expect(container.querySelector('button')).toBeDefined();
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    expect(container).toMatchSnapshot();
  });

  it('should render anchor element correctly', () => {
    const { getByTestId, container } = render(
      <ButtonBase as="a" data-testid="button-base" />,
    );
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render anchor element correctly by href only being passed and href exists', () => {
    const { getByTestId, container } = render(
      <ButtonBase href="https://www.test.com/" data-testid="button-base">
        Button Base
      </ButtonBase>,
    );
    expect(getByTestId('button-base')).toHaveClass('mm-button-base');
    expect(getByTestId('button-base')).toHaveAttribute(
      'href',
      'https://www.test.com/',
    );
    const anchor = container.getElementsByTagName('a').length;
    expect(anchor).toBe(1);
  });

  it('should render button as block', () => {
    const { getByTestId } = render(<ButtonBase block data-testid="block" />);
    expect(getByTestId('block')).toHaveClass(`mm-button-base--block`);
  });

  it('should render with different size classes', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase
          size={BUTTON_BASE_SIZES.AUTO}
          data-testid={BUTTON_BASE_SIZES.AUTO}
        />
        <ButtonBase
          size={BUTTON_BASE_SIZES.SM}
          data-testid={BUTTON_BASE_SIZES.SM}
        />
        <ButtonBase
          size={BUTTON_BASE_SIZES.MD}
          data-testid={BUTTON_BASE_SIZES.MD}
        />
        <ButtonBase
          size={BUTTON_BASE_SIZES.LG}
          data-testid={BUTTON_BASE_SIZES.LG}
        />
      </>,
    );
    expect(getByTestId(BUTTON_BASE_SIZES.AUTO)).toHaveClass(
      `mm-button-base--size-${BUTTON_BASE_SIZES.AUTO}`,
    );
    expect(getByTestId(BUTTON_BASE_SIZES.SM)).toHaveClass(
      `mm-button-base--size-${BUTTON_BASE_SIZES.SM}`,
    );
    expect(getByTestId(BUTTON_BASE_SIZES.MD)).toHaveClass(
      `mm-button-base--size-${BUTTON_BASE_SIZES.MD}`,
    );
    expect(getByTestId(BUTTON_BASE_SIZES.LG)).toHaveClass(
      `mm-button-base--size-${BUTTON_BASE_SIZES.LG}`,
    );
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <ButtonBase data-testid="classname" className="mm-button-base--test" />,
    );
    expect(getByTestId('classname')).toHaveClass('mm-button-base--test');
  });

  it('should render with different button states', () => {
    const { getByTestId } = render(
      <>
        <ButtonBase loading data-testid="loading" />
        <ButtonBase disabled data-testid="disabled" />
      </>,
    );
    expect(getByTestId('loading')).toHaveClass(`mm-button-base--loading`);
    expect(getByTestId('disabled')).toHaveClass(`mm-button-base--disabled`);
  });
  it('should render with icon', () => {
    const { getByTestId } = render(
      <ButtonBase
        data-testid="icon"
        iconName="add-square-filled"
        iconProps={{ 'data-testid': 'base-button-icon' }}
      />,
    );

    expect(getByTestId('base-button-icon')).toBeDefined();
  });
});
