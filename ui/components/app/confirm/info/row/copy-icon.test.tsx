// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { render } from '@testing-library/react';

import { CopyIcon } from './copy-icon';

describe('CopyIcon', () => {
  it('should match snapshot', () => {
    const { container } = render(<CopyIcon copyText="dummy text" />);
    expect(container).toMatchSnapshot();
  });
});
