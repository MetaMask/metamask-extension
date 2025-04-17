// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { render } from '@testing-library/react';
import { ConfirmInfoRowDivider } from './divider';

describe('ConfirmInfoRowDivider', () => {
  it('should match snapshot', () => {
    const { container } = render(<ConfirmInfoRowDivider />);
    expect(container).toMatchSnapshot();
  });
});
