import assert from 'assert';
import React from 'react';
import sinon from 'sinon';
import shallow from '../../../../../lib/shallow-with-context';
import { GAS_ESTIMATE_TYPES } from '../../../../helpers/constants/common';

import ButtonGroup from '../../../ui/button-group';
import GasPriceButtonGroup from './gas-price-button-group.component';

describe('GasPriceButtonGroup Component', function () {
  let mockButtonPropsAndFlags;
  let mockGasPriceButtonGroupProps;
  let wrapper;

  beforeEach(function () {
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

    wrapper = shallow(
      <GasPriceButtonGroup {...mockGasPriceButtonGroupProps} />,
    );
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('render', function () {
    it('should render a ButtonGroup', function () {
      assert(wrapper.is(ButtonGroup));
    });

    it('should render the correct props on the ButtonGroup', function () {
      const {
        className,
        defaultActiveButtonIndex,
        noButtonActiveByDefault,
      } = wrapper.props();
      assert.strictEqual(className, 'gas-price-button-group');
      assert.strictEqual(defaultActiveButtonIndex, 2);
      assert.strictEqual(noButtonActiveByDefault, true);
    });

    function renderButtonArgsTest(i, mockPropsAndFlags) {
      assert.deepStrictEqual(
        GasPriceButtonGroup.prototype.renderButton.getCall(i).args,
        [
          { ...mockGasPriceButtonGroupProps.gasButtonInfo[i] },
          mockPropsAndFlags,
          i,
        ],
      );
    }

    it('should call this.renderButton 3 times, with the correct args', function () {
      assert.strictEqual(
        GasPriceButtonGroup.prototype.renderButton.callCount,
        3,
      );
      renderButtonArgsTest(0, mockButtonPropsAndFlags);
      renderButtonArgsTest(1, mockButtonPropsAndFlags);
      renderButtonArgsTest(2, mockButtonPropsAndFlags);
    });

    it('should show loading if buttonDataLoading', function () {
      wrapper.setProps({ buttonDataLoading: true });
      assert(wrapper.is('div'));
      assert(wrapper.hasClass('gas-price-button-group__loading-container'));
      assert.strictEqual(wrapper.text(), 'loading');
    });
  });

  describe('renderButton', function () {
    let wrappedRenderButtonResult;

    beforeEach(function () {
      GasPriceButtonGroup.prototype.renderButtonContent.resetHistory();
      const renderButtonResult = wrapper
        .instance()
        .renderButton(
          { ...mockGasPriceButtonGroupProps.gasButtonInfo[0] },
          mockButtonPropsAndFlags,
        );
      wrappedRenderButtonResult = shallow(renderButtonResult);
    });

    it('should render a button', function () {
      assert.strictEqual(wrappedRenderButtonResult.type(), 'button');
    });

    it('should call the correct method when clicked', function () {
      assert.strictEqual(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.callCount,
        0,
      );
      wrappedRenderButtonResult.props().onClick();
      assert.strictEqual(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.callCount,
        1,
      );
      assert.deepStrictEqual(
        mockGasPriceButtonGroupProps.handleGasPriceSelection.getCall(0).args,
        [
          {
            gasPrice:
              mockGasPriceButtonGroupProps.gasButtonInfo[0].priceInHexWei,
            gasEstimateType:
              mockGasPriceButtonGroupProps.gasButtonInfo[0].gasEstimateType,
          },
        ],
      );
    });

    it('should call this.renderButtonContent with the correct args', function () {
      assert.strictEqual(
        GasPriceButtonGroup.prototype.renderButtonContent.callCount,
        1,
      );
      const {
        feeInPrimaryCurrency,
        feeInSecondaryCurrency,
        timeEstimate,
        gasEstimateType,
      } = mockGasPriceButtonGroupProps.gasButtonInfo[0];
      const { showCheck, className } = mockGasPriceButtonGroupProps;
      assert.deepStrictEqual(
        GasPriceButtonGroup.prototype.renderButtonContent.getCall(0).args,
        [
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
        ],
      );
    });
  });

  describe('renderButtonContent', function () {
    it('should render a label if passed a gasEstimateType', function () {
      const renderButtonContentResult = wrapper.instance().renderButtonContent(
        {
          gasEstimateType: 'SLOW',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.childAt(0).children().length,
        1,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.find('.someClass__label').text(),
        'slow',
      );
    });

    it('should render a feeInPrimaryCurrency if passed a feeInPrimaryCurrency', function () {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          feeInPrimaryCurrency: 'mockFeeInPrimaryCurrency',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.childAt(0).children().length,
        1,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult
          .find('.someClass__primary-currency')
          .text(),
        'mockFeeInPrimaryCurrency',
      );
    });

    it('should render a feeInSecondaryCurrency if passed a feeInSecondaryCurrency', function () {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          feeInSecondaryCurrency: 'mockFeeInSecondaryCurrency',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.childAt(0).children().length,
        1,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult
          .find('.someClass__secondary-currency')
          .text(),
        'mockFeeInSecondaryCurrency',
      );
    });

    it('should render a timeEstimate if passed a timeEstimate', function () {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {
          timeEstimate: 'mockTimeEstimate',
        },
        {
          className: 'someClass',
        },
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.childAt(0).children().length,
        1,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult
          .find('.someClass__time-estimate')
          .text(),
        'mockTimeEstimate',
      );
    });

    it('should render a check if showCheck is true', function () {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {},
        {
          className: 'someClass',
          showCheck: true,
        },
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(
        wrappedRenderButtonContentResult.find('.fa-check').length,
        1,
      );
    });

    it('should render all elements if all args passed', function () {
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
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(wrappedRenderButtonContentResult.children().length, 5);
    });

    it('should render no elements if all args passed', function () {
      const renderButtonContentResult = GasPriceButtonGroup.prototype.renderButtonContent(
        {},
        {},
      );
      const wrappedRenderButtonContentResult = shallow(
        renderButtonContentResult,
      );
      assert.strictEqual(wrappedRenderButtonContentResult.children().length, 0);
    });
  });
});
