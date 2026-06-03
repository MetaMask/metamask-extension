import React from 'react';

import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import TimerIcon from './timer-icon';

describe('TimerIcon', () => {
  it('renders the TimerIcon component', () => {
    const { container } = renderWithProvider(<TimerIcon />);
    expect(container).toMatchSnapshot();
  });
});
