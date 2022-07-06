import React from 'react';
import Tab from './tab/tab.component';
import Tabs from './tabs.component';

const initialTabs = [
  { name: 'Tab A', content: 'Tab A Content' },
  { name: 'Tab B', content: 'Tab B Content' },
  { name: 'Tab C', content: 'Tab C Content' },
];

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
    tabs: initialTabs,
  },
};

function renderTab({ name, content }, index) {
  return (
    <Tab name={name} key={name + index}>
      {content}
    </Tab>
  );
}

const Template = (args) => {
  const { onTabClick, defaultActiveTabName } = args;
  return (
    <Tabs defaultActiveTabName={defaultActiveTabName} onTabClick={onTabClick}>
      {args.tabs.map((tabProps, i) => renderTab(tabProps, i))}
    </Tabs>
  );
};

export const Default = Template.bind({});
