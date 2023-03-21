import React from 'react';
import configureMockStore from 'redux-mock-store';
import { renderWithProvider } from '../../../../test/lib/render-helpers';
import SelectHardware from './select-hardware';

const mockState = { metamask: {} };

describe('Select Hardware', () => {
  const store = configureMockStore()(mockState);

  describe('render', () => {
    it('should match snapshot', () => {
      // eslint-disable-next-line no-empty-function
      const noOp = () => {};
      const render = () => (
        <SelectHardware connectToHardwareWallet={noOp} browserSupported />
      );
      const { container } = renderWithProvider(render(), store);
      expect(container).toMatchSnapshot();
    });
  });
});
