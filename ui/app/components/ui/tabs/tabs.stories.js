import React from 'react'
import Tab from './tab/tab.component'
import Tabs from './tabs.component'
import { number, text } from '@storybook/addon-knobs/react'

export default {
  title: 'Tabs',
}

function renderTab (id) {
  return (
    <Tab
      name={text(`Tab ${id} Name`, `Tab ${id}`)}
      key={id}
    >
      {text(`Tab ${id} Contents`, `Contents of Tab ${id}`)}
    </Tab>
  )
}

export const twoTabs = () => {
  return (
    <Tabs
      defaultActiveTabIndex={number('Default Active Tab Index', 0, { min: 0 })}
    >
      {
        ['A', 'B']
          .map(renderTab)
      }
    </Tabs>
  )
}

export const manyTabs = () => {
  return (
    <Tabs
      defaultActiveTabIndex={number('Default Active Tab Index', 0, { min: 0 })}
    >
      {
        ['A', 'B', 'C', 'D', 'E']
          .map(renderTab)
      }
    </Tabs>
  )
}

export const singleTab = () => {
  return (
    <Tabs>
      <Tab
        name={text('Name', 'Single A')}
      >
        {text('Contents', 'Contents of tab')}
      </Tab>
    </Tabs>
  )
}
