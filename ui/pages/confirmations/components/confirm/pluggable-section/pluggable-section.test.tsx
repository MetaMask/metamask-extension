// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
import React from 'react';

import { renderWithConfirmContextProvider } from '../../../../../../test/lib/confirmations/render-helpers';
import { getMockPersonalSignConfirmState } from '../../../../../../test/data/confirmations/helper';
import configureStore from '../../../../../store/store';
// TODO: Fix in follow-up ticket https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
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
