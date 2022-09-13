import React from 'react';
import { shallow } from 'enzyme';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import { GAS_INPUT_MODES } from '../../../../ducks/send';
import SendGasRow from './send-gas-row.component';

describe('SendGasRow Component', () => {
  let wrapper;

  describe('render', () => {
    beforeEach(() => {
      wrapper = shallow(
        <SendGasRow
          conversionRate={20}
          convertedCurrency="mockConvertedCurrency"
          gasFeeError
          gasInputMode={GAS_INPUT_MODES.INLINE}
        />,
        { context: { t: (str) => `${str}_t`, trackEvent: () => ({}) } },
      );
      wrapper.setProps({ isMainnet: true });
    });

    it('should render a SendRowWrapper component', () => {
      expect(wrapper.is(SendRowWrapper)).toStrictEqual(true);
    });

    it('should render an AdvancedGasInputs as a child of the SendRowWrapper', () => {
      expect(wrapper.first().childAt(0)).toBeDefined();
    });
  });
});
