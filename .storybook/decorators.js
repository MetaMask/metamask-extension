import React from 'react'
import { storiesOf, addDecorator } from '@storybook/react'
import { withInfo } from '@storybook/addon-info'
import { withKnobs } from '@storybook/addon-knobs/react';

const styles = {
  height: '100vh',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
}

const CenterDecorator = story => (
  <div style={styles}>
    { story() }
  </div>
)

addDecorator((story, context) => withInfo()(story)(context))
addDecorator(withKnobs)
addDecorator(CenterDecorator)
