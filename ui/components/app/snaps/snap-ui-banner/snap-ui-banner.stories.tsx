import React, { ReactNode } from 'react';
import { BannerAlertSeverity } from '../../../component-library';
import { SnapUIBanner } from './snap-ui-banner';

export default {
  title: 'Components/App/Snaps/SnapUIBanner',
  component: SnapUIBanner,
  argTypes: {
    title: {
      control: 'text',
    },
    severity: {
      control: 'text',
    },
    children: {
      control: 'text',
    },
  },
};

export const DefaultStory = (args: {
  title: string;
  severity: BannerAlertSeverity;
  children: ReactNode;
}) => <SnapUIBanner {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  title: 'Banner title',
  severity: 'info',
  children: 'Banner content.',
};
