import React from 'react';

import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../store/store';
import PluggableSection from './pluggable-section';

const render = () => {
  const store = configureStore(getMockPersonalSignConfirmState());
  return renderWithConfirmContextProvider(<PluggableSection />, store);
};

describe('PluggableSection', () => {
  it('should render correctly', () => {
    expect(() => render()).not.toThrow();
  });
});
