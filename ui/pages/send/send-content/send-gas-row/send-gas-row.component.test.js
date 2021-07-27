import React from 'react';
import { shallow } from 'enzyme';
import sinon from 'sinon';
import SendRowWrapper from '../send-row-wrapper/send-row-wrapper.component';
import GasPriceButtonGroup from '../../../../components/app/gas-customization/gas-price-button-group';
import { GAS_INPUT_MODES } from '../../../../ducks/send';
import SendGasRow from './send-gas-row.component';

import GasFeeDisplay from './gas-fee-display/gas-fee-display.component';

const propsMethodSpies = {
  showCustomizeGasModal: sinon.spy(),
  resetGasButtons: sinon.spy(),
};

describe('SendGasRow Component', () => {
  let wrapper;

  describe('render', () => {
    beforeEach(() => {
      wrapper = shallow(
        <SendGasRow
          conversionRate={20}
          convertedCurrency="mockConvertedCurrency"
          gasFeeError
          gasLoadingError={false}
          gasTotal="mockGasTotal"
          gasInputMode={GAS_INPUT_MODES.CUSTOM}
          showCustomizeGasModal={propsMethodSpies.showCustomizeGasModal}
          resetGasButtons={propsMethodSpies.resetGasButtons}
          gasPriceButtonGroupProps={{
            someGasPriceButtonGroupProp: 'foo',
            anotherGasPriceButtonGroupProp: 'bar',
          }}
        />,
        { context: { t: (str) => `${str}_t`, trackEvent: () => ({}) } },
      );
      wrapper.setProps({ isMainnet: true });
    });

    afterEach(() => {
      propsMethodSpies.resetGasButtons.resetHistory();
    });

    it('should render a SendRowWrapper component', () => {
      expect(wrapper.name()).toStrictEqual('Fragment');
      expect(wrapper.at(0).find(SendRowWrapper)).toHaveLength(1);
    });

    it('should pass the correct props to SendRowWrapper', () => {
      const { label, showError, errorType } = wrapper
        .find(SendRowWrapper)
        .first()
        .props();

      expect(label).toStrictEqual('transactionFee_t:');
      expect(showError).toStrictEqual(true);
      expect(errorType).toStrictEqual('gasFee');
    });

    it('should render a GasFeeDisplay as a child of the SendRowWrapper', () => {
      expect(
        wrapper.find(SendRowWrapper).first().childAt(0).is(GasFeeDisplay),
      ).toStrictEqual(true);
    });

    it('should render the GasFeeDisplay', () => {
      const { gasLoadingError, gasTotal, onReset } = wrapper
        .find(SendRowWrapper)
        .first()
        .childAt(0)
        .props();
      expect(gasLoadingError).toStrictEqual(false);
      expect(gasTotal).toStrictEqual('mockGasTotal');
      expect(propsMethodSpies.resetGasButtons.callCount).toStrictEqual(0);
      onReset();
      expect(propsMethodSpies.resetGasButtons.callCount).toStrictEqual(1);
    });

    it('should render the GasPriceButtonGroup if gasInputMode is BASIC', () => {
      wrapper.setProps({ gasInputMode: GAS_INPUT_MODES.BASIC });
      const rendered = wrapper.find(SendRowWrapper).first().childAt(0);
      expect(wrapper.children()).toHaveLength(2);

      const gasPriceButtonGroup = rendered.childAt(0);
      expect(gasPriceButtonGroup.is(GasPriceButtonGroup)).toStrictEqual(true);
      expect(
        gasPriceButtonGroup.hasClass('gas-price-button-group--small'),
      ).toStrictEqual(true);
      expect(gasPriceButtonGroup.props().showCheck).toStrictEqual(false);
      expect(
        gasPriceButtonGroup.props().someGasPriceButtonGroupProp,
      ).toStrictEqual('foo');
      expect(
        gasPriceButtonGroup.props().anotherGasPriceButtonGroupProp,
      ).toStrictEqual('bar');
    });

    it('should render an advanced options button if gasInputMode is BASIC', () => {
      wrapper.setProps({ gasInputMode: GAS_INPUT_MODES.BASIC });
      const rendered = wrapper.find(SendRowWrapper).last();
      expect(wrapper.children()).toHaveLength(2);

      const advancedOptionsButton = rendered.childAt(0);
      expect(advancedOptionsButton.text()).toStrictEqual('advancedOptions_t');

      expect(propsMethodSpies.showCustomizeGasModal.callCount).toStrictEqual(0);
      advancedOptionsButton.props().onClick();
      expect(propsMethodSpies.showCustomizeGasModal.callCount).toStrictEqual(1);
    });
  });
});
