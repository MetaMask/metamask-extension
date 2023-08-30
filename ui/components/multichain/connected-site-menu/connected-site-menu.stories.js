import React from 'react';
import {
  STATUS_CONNECTED,
  STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
  STATUS_NOT_CONNECTED,
} from '../../../helpers/constants/connected-sites';
import {
  BackgroundColor,
  Color,
} from '../../../helpers/constants/design-system';
import { ConnectedSiteMenu } from '.';

export default {
  title: 'Components/Multichain/ConnectedSiteMenu',
  component: ConnectedSiteMenu,
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
    status: STATUS_NOT_CONNECTED,
  },
};

const Template = (args) => {
  return <ConnectedSiteMenu {...args} />;
};

export const DefaultStory = Template.bind({});

export const ConnectedStory = Template.bind({});
ConnectedStory.args = {
  globalMenuColor: Color.successDefault,
  text: 'connected',
  status: STATUS_CONNECTED,
};

export const ConnectedtoAnotherAccountStory = Template.bind({});
ConnectedtoAnotherAccountStory.args = {
  globalMenuColor: BackgroundColor.backgroundDefault,
  text: 'not connected',
  status: STATUS_CONNECTED_TO_ANOTHER_ACCOUNT,
};
