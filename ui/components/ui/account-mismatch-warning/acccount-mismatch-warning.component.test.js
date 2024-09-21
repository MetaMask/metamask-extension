import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import AccountMismatchWarning from './account-mismatch-warning.component';

describe('AccountMismatchWarning', () => {
  const mockStore = configureMockStore()(mockState);

  it('should match snapshot of no warning with same address and selected address', () => {
    const props = {
      address: '0x0dcd5d886577d5081b0c52e242ef29e70be3e7bc',
    };

    const { container } = renderWithProvider(
      <AccountMismatchWarning {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });

  it('should match snapshot of mismatch address warning', () => {
    const props = {
      address: '0xNotSelectedAddress',
    };

    const { container } = renderWithProvider(
      <AccountMismatchWarning {...props} />,
      mockStore,
    );

    expect(container).toMatchSnapshot();
  });
});
