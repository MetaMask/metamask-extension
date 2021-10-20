import React, { useState } from 'react';
import { Provider } from 'react-redux';
import PropTypes from 'prop-types';

import { action } from '@storybook/addon-actions';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { decGWEIToHexWEI } from '../../../helpers/utils/conversions.util';
import { useGasFeeInputs } from '../../../hooks/useGasFeeInputs';
import { EDIT_GAS_MODES, GAS_LIMITS } from '../../../../shared/constants/gas';
import EditGasDisplay from '.';

export default {
  title: 'Edit Gas Display',
  id: __filename,
};

const ProviderWrapper = ({ children, store }) => {
  return <Provider store={store}>{children}</Provider>;
};

ProviderWrapper.propTypes = {
  children: PropTypes.object,
  store: PropTypes.any,
};

const defaultEstimateToUse = 'medium';
const transaction = {
  userFeeLevel: 'medium',
  txParams: {
    maxFeePerGas: decGWEIToHexWEI('10000'),
    maxPriorityFeePerGas: '0x5600',
    gas: `0x5600`,
    gasPrice: '0x5600',
  },
};
const transactionWithDapp = {
  userFeeLevel: 'medium',
  txParams: {
    maxFeePerGas: decGWEIToHexWEI('10000'),
    maxPriorityFeePerGas: '0x5600',
    gas: `0x5600`,
    gasPrice: '0x5600',
  },
  dappSuggestedGasFees: {
    maxFeePerGas: decGWEIToHexWEI('10000'),
    maxPriorityFeePerGas: '0x5600',
    gas: `0x5600`,
    gasPrice: '0x5600',
  },
};
const minimumGasLimit = GAS_LIMITS.SIMPLE;
const mode = EDIT_GAS_MODES.MODIFY_IN_PLACE;
const BasicComponent = () => {
  const {
    maxPriorityFeePerGas,
    setMaxPriorityFeePerGas,
    maxFeePerGas,
    setMaxFeePerGas,
    gasLimit,
    setGasLimit,
  } = useGasFeeInputs(defaultEstimateToUse, transaction, minimumGasLimit, mode);

  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay
        transaction={transaction}
        gasLimit={gasLimit}
        setGasLimit={setGasLimit}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        setMaxPriorityFeePerGas={setMaxPriorityFeePerGas}
        maxFeePerGas={maxFeePerGas}
        setMaxFeePerGas={setMaxFeePerGas}
      />
    </div>
  );
};

export const Basic = () => {
  const store = configureStore(testData);

  return (
    <ProviderWrapper store={store}>
      <BasicComponent />
    </ProviderWrapper>
  );
};

const WithEducationComponent = () => {
  const {
    maxPriorityFeePerGas,
    setMaxPriorityFeePerGas,
    maxFeePerGas,
    setMaxFeePerGas,
    gasLimit,
    setGasLimit,
  } = useGasFeeInputs(defaultEstimateToUse, transaction, minimumGasLimit, mode);

  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay
        showEducationButton
        onEducationClick={() => action('Education Button Clicked')()}
        transaction={transaction}
        gasLimit={gasLimit}
        setGasLimit={setGasLimit}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        setMaxPriorityFeePerGas={setMaxPriorityFeePerGas}
        maxFeePerGas={maxFeePerGas}
        setMaxFeePerGas={setMaxFeePerGas}
      />
    </div>
  );
};

export const WithEducation = () => {
  const store = configureStore(testData);

  return (
    <ProviderWrapper store={store}>
      <WithEducationComponent />
    </ProviderWrapper>
  );
};

const WithDappSuggestedGasComponent = () => {
  const {
    maxPriorityFeePerGas,
    setMaxPriorityFeePerGas,
    maxFeePerGas,
    setMaxFeePerGas,
    gasLimit,
    setGasLimit,
  } = useGasFeeInputs(defaultEstimateToUse, transaction, minimumGasLimit, mode);

  const [
    dappSuggestedGasFeeAcknowledged,
    setDappSuggestedGasFeeAcknowledged,
  ] = useState(false);
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplay
        dappSuggestedGasFeeAcknowledged={dappSuggestedGasFeeAcknowledged}
        setDappSuggestedGasFeeAcknowledged={() =>
          setDappSuggestedGasFeeAcknowledged(!dappSuggestedGasFeeAcknowledged)
        }
        transaction={transactionWithDapp}
        gasLimit={gasLimit}
        setGasLimit={setGasLimit}
        maxPriorityFeePerGas={maxPriorityFeePerGas}
        setMaxPriorityFeePerGas={setMaxPriorityFeePerGas}
        maxFeePerGas={maxFeePerGas}
        setMaxFeePerGas={setMaxFeePerGas}
      />
    </div>
  );
};

export const WithDappSuggestedGas = () => {
  const store = configureStore(testData);

  return (
    <ProviderWrapper store={store}>
      <WithDappSuggestedGasComponent />
    </ProviderWrapper>
  );
};
