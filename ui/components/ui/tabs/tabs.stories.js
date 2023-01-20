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
    defaultActiveTabKey: {
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
    <Tab tabKey={name} key={name + index} name={name}>
      {content}
    </Tab>
  );
}

export const DefaultStory = (args) => {
  return (
    <Tabs
      defaultActiveTabKey={args.defaultActiveTabKey}
      onTabClick={args.onTabClick}
    >
      {args.tabs.map((tabProps, i) => renderTab(tabProps, i, args.t))}
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
