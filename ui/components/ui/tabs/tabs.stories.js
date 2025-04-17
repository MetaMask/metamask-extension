import React from 'react';
import Tabs from './tabs.component';
import Tab from './tab/tab.component';

export default {
  title: 'Components/UI/Tabs',
  component: Tabs,
  parameters: {
    docs: {
      description: {
        component:
          'Tabs component with support for disabled state. Disabled tabs cannot be clicked and have a muted appearance.',
      },
    },
  },
};

export const Default = {
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

export const Disabled = {
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
