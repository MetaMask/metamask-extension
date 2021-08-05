import React from 'react';
import { useSelector } from 'react-redux';
import { shallow } from 'enzyme';
import sinon from 'sinon';

import { GAS_ESTIMATE_TYPES } from '../../../../shared/constants/gas';

import messages from '../../../../app/_locales/en/messages.json';

import { getMessage } from '../../../helpers/utils/i18n-helper';

import * as i18nhooks from '../../../hooks/useI18nContext';

import { checkNetworkAndAccountSupports1559 } from '../../../selectors';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getIsGasEstimatesLoading,
} from '../../../ducks/metamask/metamask';

import GasTiming from '.';

const MOCK_FEE_ESTIMATE = {
  low: {
    minWaitTimeEstimate: 180000,
    maxWaitTimeEstimate: 300000,
    suggestedMaxPriorityFeePerGas: '3',
    suggestedMaxFeePerGas: '53',
  },
  medium: {
    minWaitTimeEstimate: 15000,
    maxWaitTimeEstimate: 60000,
    suggestedMaxPriorityFeePerGas: '7',
    suggestedMaxFeePerGas: '70',
  },
  high: {
    minWaitTimeEstimate: 0,
    maxWaitTimeEstimate: 15000,
    suggestedMaxPriorityFeePerGas: '10',
    suggestedMaxFeePerGas: '100',
  },
  estimatedBaseFee: '50',
};

jest.mock('react-redux', () => {
  const actual = jest.requireActual('react-redux');

  return {
    ...actual,
    useSelector: jest.fn(),
  };
});

const DEFAULT_OPTS = {
  gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
  gasFeeEstimates: {
    low: '10',
    medium: '20',
    high: '30',
  },
  isGasEstimatesLoading: true,
};

const generateUseSelectorRouter = (opts = DEFAULT_OPTS) => (selector) => {
  if (selector === checkNetworkAndAccountSupports1559) {
    return true;
  }
  if (selector === getGasEstimateType) {
    return opts.gasEstimateType ?? DEFAULT_OPTS.gasEstimateType;
  }
  if (selector === getGasFeeEstimates) {
    return opts.gasFeeEstimates ?? DEFAULT_OPTS.gasFeeEstimates;
  }
  if (selector === getIsGasEstimatesLoading) {
    return opts.isGasEstimatesLoading ?? DEFAULT_OPTS.isGasEstimatesLoading;
  }
  return undefined;
};

describe('Gas timing', () => {
  beforeEach(() => {
    const useI18nContext = sinon.stub(i18nhooks, 'useI18nContext');
    useI18nContext.returns((key, variables) =>
      getMessage('en', messages, key, variables),
    );
    jest.clearAllMocks();
    useSelector.mockImplementation(generateUseSelectorRouter());
  });
  afterEach(() => {
    sinon.restore();
  });

  it('renders nothing when gas is loading', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: true,
        gasFeeEstimates: null,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      }),
    );

    const wrapper = shallow(<GasTiming />);
    expect(wrapper.html()).toBeNull();
  });

  it('renders "very likely" when high estimate is chosen', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: false,
        gasFeeEstimates: MOCK_FEE_ESTIMATE,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      }),
    );

    const wrapper = shallow(<GasTiming maxPriorityFeePerGas="10" />);
    expect(wrapper.html()).toContain('gasTimingVeryPositive');
  });

  it('renders "likely" when medium estimate is chosen', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: false,
        gasFeeEstimates: MOCK_FEE_ESTIMATE,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      }),
    );

    const wrapper = shallow(<GasTiming maxPriorityFeePerGas="8" />);
    expect(wrapper.html()).toContain('gasTimingPositive');
  });

  it('renders "maybe" when low estimate is chosen', () => {
    useSelector.mockImplementation(
      generateUseSelectorRouter({
        isGasEstimatesLoading: false,
        gasFeeEstimates: MOCK_FEE_ESTIMATE,
        gasEstimateType: GAS_ESTIMATE_TYPES.FEE_MARKET,
      }),
    );

    const wrapper = shallow(<GasTiming maxPriorityFeePerGas="3" />);
    expect(wrapper.html()).toContain('gasTimingNegative');
  });
});
