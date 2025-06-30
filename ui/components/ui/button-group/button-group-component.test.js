import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
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
});
