import React from 'react';
import { Color } from '../../../helpers/constants/design-system';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu';

export default {
  title: 'Components/Multichain/MultichainConnectedSiteMenu',
  component: MultichainConnectedSiteMenu,
  argTypes: {
    globalMenuColor: {
      control: 'text',
    },
    text: {
      control: 'text',
    },
    status: {
      control: 'text',
    },
  },
  args: {
    globalMenuColor: Color.iconAlternative,
    text: 'Not Connected',
    status: 'STATUS_NOT_CONNECTED',
  },
};

const Template = (args) => {
  return <MultichainConnectedSiteMenu {...args} />;
};

export const DefaultStory = Template.bind({});

export const ConnectedStory = Template.bind({});
ConnectedStory.args = {
  globalMenuColor: Color.successDefault,
  text: 'Connected',
  status: 'CONNECTED',
};

export const ConnectedtoAnotherAccountStory = Template.bind({});
ConnectedtoAnotherAccountStory.args = {
  globalMenuColor: Color.warningDefault,
  status: 'STATUS_CONNECTED_TO_ANOTHER_ACCOUNT',
};
