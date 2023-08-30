import React from 'react';
import { ConnectedSitePermissionsModal } from './connected-site-permissions-modal';

export default {
  title: 'Components/Multichain/ConnectedSitePermissionsModal',
};

const Template = (args) => <ConnectedSitePermissionsModal {...args} />;

export const DefaultView = Template.bind({});
DefaultView.args = {
  onClose: () => {
    console.log('close');
  },
};

DefaultView.argTypes = {
  onClose: { control: 'function' },
};
