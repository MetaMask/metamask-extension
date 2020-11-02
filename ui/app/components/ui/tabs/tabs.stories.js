import React from 'react'
import { text } from '@storybook/addon-knobs/react'
import Tab from './tab/tab.component'
import Tabs from './tabs.component'

export default {
  title: 'Tabs',
}

function renderTab(id) {
  return (
    <Tab name={text(`Tab ${id} Name`, `Tab ${id}`)} key={id}>
      {text(`Tab ${id} Contents`, `Contents of Tab ${id}`)}
    </Tab>
  )
}

export const twoTabs = () => {
  return <Tabs>{['A', 'B'].map(renderTab)}</Tabs>
}

export const manyTabs = () => {
  return <Tabs>{['A', 'B', 'C', 'D', 'E'].map(renderTab)}</Tabs>
}

export const singleTab = () => {
  return (
    <Tabs>
      <Tab name={text('Name', 'Single A')}>
        {text('Contents', 'Contents of tab')}
      </Tab>
    </Tabs>
  )
}
