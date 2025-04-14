// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';
import { renderWithProvider } from '../../../../../../test/jest';
import { NoConnectionContent } from './no-connection';

describe('No Connections Content', () => {
  const render = () => {
    return renderWithProvider(<NoConnectionContent />);
  };
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
