import React from 'react';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import ButtonGroup from '.';

describe('ButtonGroup Component', () => {
  const props = {
    defaultActiveButtonIndex: 1,
    disabled: false,
    className: 'someClassName',
    style: {
      color: 'red',
    },
  };

  const mockButtons = [
    <button key="a">
      <div className="mockClass" />
    </button>,
    <button key="b" />,
    <button key="c" />,
  ];

  it('should match snapshot with default variant', () => {
    const { container } = renderWithProvider(
      <ButtonGroup {...props}>{mockButtons}</ButtonGroup>,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with radiogroup variant', () => {
    const { container } = renderWithProvider(
      <ButtonGroup {...props} variant="radiogroup">
        {mockButtons}
      </ButtonGroup>,
    );

    expect(container).toMatchSnapshot();
  });

  it('re-applies newActiveButtonIndex after an internal click', () => {
    const { getByTestId } = renderWithProvider(
      <ButtonGroup newActiveButtonIndex={0}>{mockButtons}</ButtonGroup>,
    );

    fireEvent.click(getByTestId('button-group__button2'));

    expect(getByTestId('button-group__button0')).toHaveClass(
      'button-group__button--active',
    );
    expect(getByTestId('button-group__button2')).not.toHaveClass(
      'button-group__button--active',
    );
  });
});
