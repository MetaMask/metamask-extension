import React from 'react';
import { Meta, StoryFn } from '@storybook/react';
import InstitutionalEntityDonePage from '.';

export default {
  title: 'Components/Institutional/InstitutionalEntityDonePage',
  component: InstitutionalEntityDonePage,
  args: {
    history: {
      push: () => {
        /**/
      },
    },
    mostRecentOverviewPage: 'test',
    location: {
      state: {
        imgSrc: './images/logo/metamask-fox.svg',
        title: 'title',
        description: 'description',
      },
    },
  },
} as Meta<typeof InstitutionalEntityDonePage>;

const Template: StoryFn<typeof InstitutionalEntityDonePage> = (args) => (
  <InstitutionalEntityDonePage {...args} />
);

export const DefaultStory = Template.bind({});
DefaultStory.storyName = 'InstitutionalEntityDonePage';
