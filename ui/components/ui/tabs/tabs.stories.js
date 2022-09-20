import React from 'react';
import Tab from './tab/tab.component';
import Tabs from './tabs.component';

export default {
  title: 'Components/UI/Tabs',
  id: __filename,
  argTypes: {
    tabs: {
      control: 'object',
      name: 'Tabs',
    },
    defaultActiveTabName: {
      control: {
        type: 'text',
      },
    },
    onTabClick: { action: 'onTabClick' },
  },
  args: {
    tabs: [
      { name: 'Tab A', content: 'Tab A Content' },
      { name: 'Tab B', content: 'Tab B Content' },
      { name: 'Tab C', content: 'Tab C Content' },
    ],
  },
};

function renderTab({ name, content }, index) {
  return (
    <Tab name={name} key={name + index}>
      {content}
    </Tab>
  );
}

export const DefaultStory = (args) => {
  return (
    <Tabs
      defaultActiveTabName={args.defaultActiveTabName}
      onTabClick={args.onTabClick}
    >
      {args.tabs.map((tabProps, i) => renderTab(tabProps, i))}
    </Tabs>
  );
};

DefaultStory.storyName = 'Default';
