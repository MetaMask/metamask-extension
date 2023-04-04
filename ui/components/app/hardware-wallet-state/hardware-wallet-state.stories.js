import React from 'react';
import { Provider } from 'react-redux';
import { cloneDeep } from 'lodash';

import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import { HardwareWalletStates } from '../../../../shared/constants/hardware-wallets';

import HardwareWalletState from '.';

const customStore = ({ hardwareWalletState = HardwareWalletStates.unknown } = {}) => {
  const data = cloneDeep({
    ...testData,
    appState: {
      ...testData?.appState,
      hardwareWalletState,
    },
  });
  return configureStore(data);
};

export default {
  title: 'Components/App/HardwareWalletState',
  argTypes: {
    pollingRateMs: {
      control: 'number',
    },
    headless: {
      control: 'boolean',
    },    
    onUpdate: {
      action: 'onUpdate',
    },
  },
  args: {
    pollingRateMs: 2000,
    headless: false,
  },
};

export const LockedStory = (args) => (
  <Provider store={customStore({ hardwareWalletState: HardwareWalletStates.locked })}>
    <HardwareWalletState {...args} />
  </Provider>
);
LockedStory.storyName = 'Locked';

export const UnlockedStory = (args) => (
  <Provider store={customStore({ hardwareWalletState: HardwareWalletStates.unlocked })}>
    <HardwareWalletState {...args} />
  </Provider>
);
UnlockedStory.storyName = 'Unlocked';

export const DefaultStory = (args) => (
  <Provider store={customStore({})}>
    <HardwareWalletState {...args} />
  </Provider>
);
DefaultStory.storyName = 'Default';

export const CustomH1ComponentStory = (args) => (
  <Provider store={customStore({ hardwareWalletState: HardwareWalletStates.locked })}>
    <HardwareWalletState
      Component={({ children, ...props }) => <h1 {...props}>{children}</h1>}
      {...args}
    />
  </Provider>
);
CustomH1ComponentStory.storyName = 'CustomH1Component';
