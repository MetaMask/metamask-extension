import React from 'react';
import configureMockStore from 'redux-mock-store';

import {
  getMockConfirmStateForTransaction,
  getMockPersonalSignConfirmState,
} from '../../../../../../test/data/confirmations/helper';
import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { upgradeAccountConfirmation } from '../../../../../../test/data/confirmations/batch-transaction';
import { Confirmation } from '../../../types/confirm';
import { Splash } from './splash';

describe('Splash', () => {
  it('return null if current confirmation is not upgrade confirmation', () => {
    const mockStore = configureMockStore([])(getMockPersonalSignConfirmState);
    const { container } = renderWithConfirmContextProvider(
      <Splash />,
      mockStore,
    );

    expect(container.firstChild).toBeNull();
  });

  it('return splash screen if current confirmation is upgrade confirmation', () => {
    const mockStore = configureMockStore([])(
      getMockConfirmStateForTransaction(
        upgradeAccountConfirmation as Confirmation,
      ),
    );
    const { container } = renderWithConfirmContextProvider(
      <Splash />,
      mockStore,
    );

    expect(container.firstChild).not.toBeNull();
  });
});
