import React from 'react';
import { MultipleAlertModal } from './multiple-alert-modal';
import { Meta } from '@storybook/react';
import configureStore from '../../../../../store/store';
import { Provider } from 'react-redux';
import { baseAlertsMock } from '../alert-modal/alert-modal.stories';

const OWNER_ID_MOCK = '123';

const storeMock = configureStore({ confirmAlerts: {
  alerts: {[OWNER_ID_MOCK]: baseAlertsMock},
  confirmed: {[OWNER_ID_MOCK]: {'From': false, 'Data': false, 'Contract': false}},
  } });

export default {
  title: 'Confirmations/Components/Alerts/MultipleAlertModal',
  component: MultipleAlertModal,
  argTypes: {
    alertKey: {
      control: 'text',
      description: 'The unique key representing the specific alert field .',
    },
    onActionClick: {
      action: 'onClick',
      description: 'The function to execute a determinate action based on the action key.',
    },
    onAcknowledgeClick: {
      action: 'onClick',
      description: 'The handler for the alert modal.',
    },
    onClose: {
      action: 'onClick',
      description: 'The function to be executed when the modal needs to be closed.',
    },
    ownerId: {
      control: 'text',
      description: 'The unique identifier of the entity that owns the alert.',
    },
  },
  args: {
    onAcknowledgeClick: () => {},
    onClose: () => {},
    ownerId: OWNER_ID_MOCK,
  },
  decorators: [(story) => <Provider store={storeMock}>{story()}</Provider>],
} as Meta<typeof MultipleAlertModal>;

export const TemplateStory = (args) => {
  return <MultipleAlertModal alertKey={'From'} {...args} />;
};
TemplateStory.storyName = 'Multiple Critical Alert Modal';

/**
 * Single Critical Alert Modal.
 */
export const SingleCriticalAlertModal = TemplateStory.bind({});
SingleCriticalAlertModal.storyName = 'Single Critical Alert Modal';
SingleCriticalAlertModal.args = {
  alertKey: 'From',
};
SingleCriticalAlertModal.decorators = [
  (story) => {
    const singleAlertStore = configureStore({
      confirmAlerts: {
        alerts: { [OWNER_ID_MOCK]: [baseAlertsMock[0]] },
        confirmed: { [OWNER_ID_MOCK]: { 'From': false } },
      }
    });
    return <Provider store={singleAlertStore}>{story()}</Provider>
  }
];

/**
 * Multiple Warning Alert Modal.
 */
export const MultipleWarningAlertModal = TemplateStory.bind({});

MultipleWarningAlertModal.storyName = 'Multiple Warning Alert Modal';
MultipleWarningAlertModal.args = {
  alertKey: 'Data',
};

/**
 * Multiple Info Alert Modal.
 */
export const MultipleInfoAlertModal = TemplateStory.bind({});
MultipleInfoAlertModal.storyName = 'Multiple Info Alert Modal';
MultipleInfoAlertModal.args = {
  alertKey: 'Contract',
};

/**
 * Multiple Critical Alert Modal.
 */
export const MultipleCriticalAlertModal = TemplateStory.bind({});
MultipleCriticalAlertModal.storyName = 'Multiple Critical Alert Modal';
MultipleCriticalAlertModal.args = {
  alertKey: 'From',
};