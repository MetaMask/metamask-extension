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
    <button key="b"></button>,
    <button key="c"></button>,
  ];

  it('should match snapshot', () => {
    const { container } = renderWithProvider(
      <ButtonGroup {...props}>{mockButtons}</ButtonGroup>,
    );

    expect(container).toMatchSnapshot();
  });
});
