import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Tabs, Tab } from './index';

const meta: Meta<typeof Tabs> = {
  title: 'Components/UI/Tabs',
  component: Tabs,
  argTypes: {
    defaultActiveTabKey: {
      control: 'text',
    },
    onTabClick: {
      action: 'tab-clicked',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Tabs>;

export const Default: Story = {
  args: {
    children: [
      <Tab key="tab1" name="Tab 1" tabKey="tab1">
        Content 1
      </Tab>,
      <Tab key="tab2" name="Tab 2" tabKey="tab2">
        Content 2
      </Tab>,
      <Tab key="tab3" name="Tab 3" tabKey="tab3">
        Content 3
      </Tab>,
    ],
  },
};

export const Disabled: Story = {
  args: {
    children: [
      <Tab key="tab1" name="Tab 1" tabKey="tab1">
        Content 1
      </Tab>,
      <Tab key="tab2" name="Tab 2" tabKey="tab2" disabled>
        Content 2 (Disabled)
      </Tab>,
      <Tab key="tab3" name="Tab 3" tabKey="tab3">
        Content 3
      </Tab>,
    ],
  },
};
