import React from 'react';
import DropdownTab from './snaps/dropdown-tab';
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
    onChange: { action: 'onChange' },
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
    </Tabs>
  );
};

DefaultStory.storyName = 'Default';

export const DropdownStory = (args) => {
  return (
    <Tabs>
      <DropdownTab
        options={[
          { name: 'Insight Snap', value: 'Insight Snap' },
          { name: 'Tenderly Insight', value: 'Tenderly Insight' },
        ]}
        onChange={args.onChange}
      >
        This is a dropdown Tab
      </DropdownTab>
    </Tabs>
  );
};
