import React from 'react';
import { StoryFn, Meta } from '@storybook/react';
import ConfirmConnectCustodianModal from './confirm-connect-custodian-modal';

export default {
  title: 'Components/Institutional/ConfirmConnectCustodianModal',
  component: ConfirmConnectCustodianModal,
  args: {
    onModalClose: () => {},
    custodianName: 'Qredo',
    custodianURL: 'https://qredo.com',
  },
} as Meta<typeof ConfirmConnectCustodianModal>;

const Template: StoryFn<typeof ConfirmConnectCustodianModal> = (args) => (
  <ConfirmConnectCustodianModal {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'ConfirmConnectCustodianModal';
