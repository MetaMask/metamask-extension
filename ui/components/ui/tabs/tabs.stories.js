import React from 'react';
import { text } from '@storybook/addon-knobs';
import Tab from './tab/tab.component';
import Tabs from './tabs.component';

export default {
  title: 'Components/UI/Tabs',
  id: __filename,
};

function renderTab(id) {
  return (
    <Tab name={text(`Tab ${id} Name`, `Tab ${id}`)} key={id}>
      {text(`Tab ${id} Contents`, `Contents of Tab ${id}`)}
    </Tab>
  );
}

export const TwoTabs = () => {
  return <Tabs>{['A', 'B'].map(renderTab)}</Tabs>;
};

export const ManyTabs = () => {
  return <Tabs>{['A', 'B', 'C', 'D', 'E'].map(renderTab)}</Tabs>;
};

export const SingleTab = () => {
  return (
    <Tabs>
      <Tab name={text('Name', 'Single A')}>
        {text('Contents', 'Contents of tab')}
      </Tab>
    </Tabs>
  );
};
