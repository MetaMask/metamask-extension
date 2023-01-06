import React from 'react';
import DropdownTab from './dropdown-tab';
import Tab from './tab/tab.component';
import Tabs from './tabs.component';

export default {
  title: 'Components/UI/Tabs',

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
      <DropdownTab
        options={[
          { name: 'Insight Snap', value: 'Insight Snap' },
          { name: 'Tenderly Insight', value: 'Tenderly Insight' },
        ]}
      >
        This is a dropdown Tab
      </DropdownTab>
    </Tabs>
  );
};

DefaultStory.storyName = 'Default';
