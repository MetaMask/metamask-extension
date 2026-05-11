import React from 'react';
import configureMockStore from 'redux-mock-store';
import thunk from 'redux-thunk';
import { fireEvent } from '@testing-library/react';
import { renderWithProvider } from '../../../../test/lib/render-helpers-navigate';
import { UnlockPasskeyIconButton } from './unlock-passkey-icon-button';

const mockStore = configureMockStore([thunk])({ metamask: {} });

describe('UnlockPasskeyIconButton', () => {
  it('invokes onClick when pressed', () => {
    const onClick = jest.fn();
    const { getByTestId } = renderWithProvider(
      <UnlockPasskeyIconButton disabled={false} onClick={onClick} />,
      mockStore,
      '/unlock',
    );

    fireEvent.click(getByTestId('unlock-with-passkey'));

    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
