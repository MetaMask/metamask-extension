import React from 'react';
import testData from '../../../.storybook/test-data';
import { MultichainConnectedSiteMenu } from './multichain-connected-site-menu.component';

const connectedSubjectsMetaData = Object.values(
  testData.metamask.subjectMetadata,
);

export default {
  title: 'Components/UI/MultichainConnectedSiteMenu',

  component: MultichainConnectedSiteMenu,
  argTypes: {
    connectedSubjects: {
      control: 'array',
    },
  },
  args: {
    connectedSubjects: [],
  },
};

export const DefaultStory = (args) => <MultichainConnectedSiteMenu {...args} />;

DefaultStory.storyName = 'Default';

export const ConnectedStory = (args) => (
  <MultichainConnectedSiteMenu {...args} />
);

ConnectedStory.args = {
  connectedSubjects: connectedSubjectsMetaData,
};
