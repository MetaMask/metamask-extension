import React from 'react';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import { ConnectAccountsModal } from './connect-accounts-modal';

{
  /* Todo: Update Tests */
}

describe('Connect More Accounts Modal', () => {
  const render = () => {
    return renderWithProvider(
      <ConnectAccountsModal onClose={() => console.log('close')} />,
    );
  };
  it('should render correctly', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });
});
