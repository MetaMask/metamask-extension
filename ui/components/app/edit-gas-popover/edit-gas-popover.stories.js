import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import { boolean } from '@storybook/addon-knobs';
import { decGWEIToHexWEI } from '../../../helpers/utils/conversions.util';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import {
  EDIT_GAS_MODES,
  GAS_RECOMMENDATIONS,
} from '../../../../shared/constants/gas';

import EditGasPopover from '.';

const store = configureStore(testData);

export default {
  title: 'Edit Gas Display Popover',
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  id: __filename,
};

export const Basic = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover
        transaction={{
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: {
            maxFeePerGas: decGWEIToHexWEI('10000'),
            maxPriorityFeePerGas: '0x5600',
            gas: `0x5600`,
            gasPrice: '0x5600',
          },
        }}
        defaultEstimateToUse={GAS_RECOMMENDATIONS.HIGH}
        mode={EDIT_GAS_MODES.SWAPS}
        confirmButtonText="Submit"
        onClose={() => action(`Close Edit Gas Popover`)()}
        minimumGasLimit="5700"
      />
    </div>
  );
};

export const BasicWithDifferentButtonText = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover
        confirmButtonText="Custom Value"
        transaction={{
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: {
            maxFeePerGas: decGWEIToHexWEI('10000'),
            maxPriorityFeePerGas: '0x5600',
            gas: `0x5600`,
            gasPrice: '0x5600',
          },
        }}
        defaultEstimateToUse={GAS_RECOMMENDATIONS.HIGH}
        mode={EDIT_GAS_MODES.SWAPS}
        onClose={() => action(`Close Edit Gas Popover`)()}
        minimumGasLimit="5700"
      />
    </div>
  );
};

export const EducationalContentFlow = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasPopover
        editGasDisplayProps={{
          showEducationButton: boolean('Show Education Button', true),
        }}
        transaction={{
          userFeeLevel: GAS_RECOMMENDATIONS.MEDIUM,
          txParams: {
            maxFeePerGas: decGWEIToHexWEI('10000'),
            maxPriorityFeePerGas: '0x5600',
            gas: `0x5600`,
            gasPrice: '0x5600',
          },
        }}
        defaultEstimateToUse={GAS_RECOMMENDATIONS.HIGH}
        mode={EDIT_GAS_MODES.SWAPS}
        confirmButtonText="Submit"
        onClose={() => action(`Close Edit Gas Popover`)()}
        minimumGasLimit="5700"
      />
    </div>
  );
};
