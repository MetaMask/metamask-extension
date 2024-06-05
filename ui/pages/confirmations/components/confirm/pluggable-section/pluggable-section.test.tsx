import React from 'react';

import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/jest';
import { unapprovedPersonalSignMsg } from '../../../../../../test/data/confirmations/personal_sign';
import configureStore from '../../../../../store/store';
import PluggableSection from './pluggable-section';

const render = () => {
  const store = configureStore({
    metamask: {
      ...mockState.metamask,
    },
    confirm: {
      currentConfirmation: unapprovedPersonalSignMsg,
    },
  });

  return renderWithProvider(<PluggableSection />, store);
};

describe('PluggableSection', () => {
  it('should render correctly', () => {
    expect(() => render()).not.toThrow();
  });
});
