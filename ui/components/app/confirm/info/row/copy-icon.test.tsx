import React from 'react';
import { render } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

import { CopyIcon } from './copy-icon';

jest.mock('../../../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => [false, jest.fn().mockResolvedValue(true)],
}));

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

  it('does not stop propagation by default', async () => {
    const user = userEvent.setup();
    const parentClickHandler = jest.fn();
    const { getByLabelText } = render(
      <div onClick={parentClickHandler}>
        <CopyIcon copyText="dummy text" />
      </div>,
    );
    await user.click(getByLabelText('copy-button'));
    expect(parentClickHandler).toHaveBeenCalled();
  });

  it('stops propagation when isStopPropagationEnabled is true', async () => {
    const user = userEvent.setup();
    const parentClickHandler = jest.fn();
    const { getByLabelText } = render(
      <div onClick={parentClickHandler}>
        <CopyIcon copyText="dummy text" isStopPropagationEnabled />
      </div>,
    );
    await user.click(getByLabelText('copy-button'));
    expect(parentClickHandler).not.toHaveBeenCalled();
  });
});
