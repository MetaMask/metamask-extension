import React from 'react';
import sinon from 'sinon';
import { shallowWithContext } from '../../../../../test/lib/render-helpers';
import { GAS_ESTIMATE_TYPES } from '../../../../helpers/constants/common';

import ButtonGroup from '../../../ui/button-group';
import GasPriceButtonGroup from './gas-price-button-group.component';

describe('GasPriceButtonGroup Component', () => {
  let mockButtonPropsAndFlags;
  let mockGasPriceButtonGroupProps;
  let wrapper;

  beforeEach(() => {
    mockGasPriceButtonGroupProps = {
      buttonDataLoading: false,
      className: 'gas-price-button-group',
      gasButtonInfo: [
        {
          gasEstimateType: GAS_ESTIMATE_TYPES.SLOW,
          feeInPrimaryCurrency: '$0.52',
          feeInSecondaryCurrency: '0.0048 ETH',
          timeEstimate: '~ 1 min 0 sec',
          priceInHexWei: '0xa1b2c3f',
        },
        {
          gasEstimateType: GAS_ESTIMATE_TYPES.AVERAGE,
          feeInPrimaryCurrency: '$0.39',
          feeInSecondaryCurrency: '0.004 ETH',
          timeEstimate: '~ 1 min 30 sec',
          priceInHexWei: '0xa1b2c39',
        },
        {
          gasEstimateType: GAS_ESTIMATE_TYPES.FAST,
          feeInPrimaryCurrency: '$0.30',
          feeInSecondaryCurrency: '0.00354 ETH',
          timeEstimate: '~ 2 min 1 sec',
          priceInHexWei: '0xa1b2c30',
        },
      ],
      handleGasPriceSelection: sinon.spy(),
      noButtonActiveByDefault: true,
      defaultActiveButtonIndex: 2,
      showCheck: true,
    };

    mockButtonPropsAndFlags = {
      className: mockGasPriceButtonGroupProps.className,
      handleGasPriceSelection:
        mockGasPriceButtonGroupProps.handleGasPriceSelection,
      showCheck: mockGasPriceButtonGroupProps.showCheck,
    };

    sinon.spy(GasPriceButtonGroup.prototype, 'renderButton');
    sinon.spy(GasPriceButtonGroup.prototype, 'renderButtonContent');

    wrapper = shallowWithContext(
      <GasPriceButtonGroup {...mockGasPriceButtonGroupProps} />,
    );
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('render', () => {
    it('should render a ButtonGroup', () => {
      expect(wrapper.is(ButtonGroup)).toStrictEqual(true);
    });

    it('should render the correct props on the ButtonGroup', () => {
      const {
        className,
        defaultActiveButtonIndex,
        noButtonActiveByDefault,
      } = wrapper.props();
      expect(className).toStrictEqual('gas-price-button-group');
      expect(defaultActiveButtonIndex).toStrictEqual(2);
      expect(noButtonActiveByDefault).toStrictEqual(true);
    });

    function renderButtonArgsTest(i, mockPropsAndFlags) {
      expect(
        GasPriceButtonGroup.prototype.renderButton.getCall(i).args,
      ).toStrictEqual([
        { ...mockGasPriceButtonGroupProps.gasButtonInfo[i] },
        mockPropsAndFlags,
        i,
      ]);
    }

    it('should call this.renderButton 3 times, with the correct args', () => {
      expect(
        GasPriceButtonGroup.prototype.renderButton.callCount,
      ).toStrictEqual(3);
      renderButtonArgsTest(0, mockButtonPropsAndFlags);
      renderButtonArgsTest(1, mockButtonPropsAndFlags);
      renderButtonArgsTest(2, mockButtonPropsAndFlags);
    });

    it('should show loading if buttonDataLoading', () => {
      wrapper.setProps({ buttonDataLoading: true });
      expect(wrapper.is('div')).toStrictEqual(true);
      expect(
        wrapper.hasClass('gas-price-button-group__loading-container'),
      ).toStrictEqual(true);
      expect(wrapper.text()).toStrictEqual('loading');
    });
  });

  describe('renderButton', () => {
    let wrappedRenderButtonResult;

    beforeEach(() => {
      GasPriceButtonGroup.prototype.renderButtonContent.resetHistory();
      const renderButtonResult = wrapper
        .instance()
        .renderButton(
          { ...mockGasPriceButtonGroupProps.gasButtonInfo[0] },
          mockButtonPropsAndFlags,
        );
      wrappedRenderButtonResult = shallowWithContext(renderButtonResult);
    });

    it('should render a button', () => {
      expect(wrappedRenderButtonResult.type()).toStrictEqual('button');
    });

    it('should call the correct method when clicked', () => {
      expect(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.callCount,
      ).toStrictEqual(0);
      wrappedRenderButtonResult.props().onClick();
      expect(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.callCount,
      ).toStrictEqual(1);
      expect(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.getCall(0).args,
      ).toStrictEqual([
        {
          gasPrice: mockGasPriceButtonGroupProps.gasButtonInfo[0].priceInHexWei,
          gasEstimateType:
            mockGasPriceButtonGroupProps.gasButtonInfo[0].gasEstimateType,
        },
      ]);
    });

    it('should call this.renderButtonContent with the correct args', () => {
      expect(
        GasPriceButtonGroup.prototype.renderButtonContent.callCount,
      ).toStrictEqual(1);
      const {
        feeInPrimaryCurrency,
        feeInSecondaryCurrency,
        timeEstimate,
        gasEstimateType,
      } = mockGasPriceButtonGroupProps.gasButtonInfo[0];
      const { showCheck, className } = mockGasPriceButtonGroupProps;
      expect(
        GasPriceButtonGroup.prototype.renderButtonContent.getCall(0).args,
      ).toStrictEqual([
        {
          gasEstimateType,
          feeInPrimaryCurrency,
          feeInSecondaryCurrency,
          timeEstimate,
        },
        {
          showCheck,
          className,
        },
      ]);
    });
  });

  describe('renderButtonContent', () => {
    it('should render a label if passed a gasEstimateType', () => {
      const renderButtonContentResult = wrapper.instance().renderButtonContent(
        {
          gasEstimateType: 'SLOW',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(
        wrappedRenderButtonContentResult.childAt(0).children(),
      ).toHaveLength(1);
      expect(
        wrappedRenderButtonContentResult.find('.someClass__label').text(),
      ).toStrictEqual('slow');
    });

    it('should render a feeInPrimaryCurrency if passed a feeInPrimaryCurrency', () => {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          feeInPrimaryCurrency: 'mockFeeInPrimaryCurrency',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(
        wrappedRenderButtonContentResult.childAt(0).children(),
      ).toHaveLength(1);
      expect(
        wrappedRenderButtonContentResult
          .find('.someClass__primary-currency')
          .text(),
      ).toStrictEqual('mockFeeInPrimaryCurrency');
    });

    it('should render a feeInSecondaryCurrency if passed a feeInSecondaryCurrency', () => {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          feeInSecondaryCurrency: 'mockFeeInSecondaryCurrency',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(
        wrappedRenderButtonContentResult.childAt(0).children(),
      ).toHaveLength(1);
      expect(
        wrappedRenderButtonContentResult
          .find('.someClass__secondary-currency')
          .text(),
      ).toStrictEqual('mockFeeInSecondaryCurrency');
    });

    it('should render a timeEstimate if passed a timeEstimate', () => {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          timeEstimate: 'mockTimeEstimate',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(
        wrappedRenderButtonContentResult.childAt(0).children(),
      ).toHaveLength(1);
      expect(
        wrappedRenderButtonContentResult
          .find('.someClass__time-estimate')
          .text(),
      ).toStrictEqual('mockTimeEstimate');
    });

    it('should render a check if showCheck is true', () => {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {},
        {
          className: 'someClass',
          showCheck: true,
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(wrappedRenderButtonContentResult.find('.fa-check')).toHaveLength(
        1,
      );
    });

    it('should render all elements if all args passed', () => {
      const renderButtonContentResult = wrapper.instance().renderButtonContent(
        {
          gasEstimateType: 'SLOW',
          feeInPrimaryCurrency: 'mockFeeInPrimaryCurrency',
          feeInSecondaryCurrency: 'mockFeeInSecondaryCurrency',
          timeEstimate: 'mockTimeEstimate',
        },
        {
          className: 'someClass',
          showCheck: true,
        },
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(wrappedRenderButtonContentResult.children()).toHaveLength(5);
    });

    it('should render no elements if all args passed', () => {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {},
        {},
      );
      const wrappedRenderButtonContentResult = shallowWithContext(
        renderButtonContentResult,
      );
      expect(wrappedRenderButtonContentResult.children()).toHaveLength(0);
    });
  });
});
