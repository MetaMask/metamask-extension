import React from 'react'
import { storiesOf } from '@storybook/react'
import TextField from './'

storiesOf('TextField', module)
  .add('text', () =>
    <TextField
      label="Text"
      type="text"
    />
  )
  .add('password', () =>
    <TextField
      label="Password"
      type="password"
    />
  )
  .add('error', () =>
    <TextField
      type="text"
      label="Name"
      error="Invalid value"
    />
  )
