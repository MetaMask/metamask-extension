import React from 'react';
import { Provider } from 'react-redux';
import testData from '../../../../.storybook/test-data';
import configureStore from '../../../store/store';
import AutoDetectNftModal from './auto-detect-nft-modal';

const customData = {
  ...testData,
  metamask: {
    ...testData.metamask,
    currentCurrency: 'USD',
    intlLocale: 'en-US',
  },
};
const customStore = configureStore(customData);

export default {
  title: 'Components/App/AutoDetectNftModal',
  component: AutoDetectNftModal,
  decorators: [
    (Story) => (
      <Provider store={customStore}>
        <Story />
      </Provider>
    ),
  ],
  argTypes: {
    isOpen: {
      control: 'boolean',
    },
    onClose: { action: 'onClose' },
  },
  args: {
    isOpen: true,
  },
};

const Template = (args) => <AutoDetectNftModal {...args} />;

export const ModalOpen = Template.bind({});
ModalOpen.args = {
  isOpen: true,
};

export const ModalClosed = Template.bind({});
ModalClosed.args = {
  isOpen: false,
};
