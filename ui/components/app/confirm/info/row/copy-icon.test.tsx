import React from 'react';
import { fireEvent, render } from '@testing-library/react';

import { CopyIcon } from './copy-icon';

describe('CopyIcon', () => {
  it('should match snapshot', () => {
    const { container } = render(<CopyIcon copyText="dummy text" />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with isStopPropagationEnabled', () => {
    const { container } = render(
      <CopyIcon copyText="dummy text" isStopPropagationEnabled />,
    );
    expect(container).toMatchSnapshot();
  });

  it('does not stop propagation by default', () => {
    const parentClickHandler = jest.fn();
    const { getByLabelText } = render(
      <div onClick={parentClickHandler}>
        <CopyIcon copyText="dummy text" />
      </div>,
    );
    fireEvent.click(getByLabelText('copy-button'));
    expect(parentClickHandler).toHaveBeenCalled();
  });

  it('stops propagation when isStopPropagationEnabled is true', () => {
    const parentClickHandler = jest.fn();
    const { getByLabelText } = render(
      <div onClick={parentClickHandler}>
        <CopyIcon copyText="dummy text" isStopPropagationEnabled />
      </div>,
    );
    fireEvent.click(getByLabelText('copy-button'));
    expect(parentClickHandler).not.toHaveBeenCalled();
  });
});
