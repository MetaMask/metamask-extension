import React from 'react';
import configureStore from '../../../store/store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import mockState from '../../../../test/data/mock-state.json';
import { SEND_STAGES } from '../../../ducks/send';
import { AppHeader } from '.';

const render = (stateChanges = {}, location = jest.fn()) => {
  const store = configureStore({
    ...mockState,
    activeTab: {
      origin: 'https://remix.ethereum.org',
    },
    ...stateChanges,
  });
  return renderWithProvider(<AppHeader location={location} />, store);
};

describe('App Header', () => {
  it('should match snapshot', () => {
    const { container } = render();
    expect(container).toMatchSnapshot();
  });

  it('should disable the network picker during a send', () => {
    const { getByTestId } = render({ send: { stage: SEND_STAGES.DRAFT } });
    expect(getByTestId('network-display')).toBeDisabled();
  });

  it('should allow switching accounts during a send', () => {
    const { getByTestId } = render({ send: { stage: SEND_STAGES.DRAFT } });
    expect(getByTestId('account-menu-icon')).toBeEnabled();
  });
});
