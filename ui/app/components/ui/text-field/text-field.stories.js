import React from 'react'
import TextField from '.'

export default {
  title: 'TextField',
}

export const text = () => <TextField label="Text" type="text" />

export const password = () => <TextField label="Password" type="password" />

export const error = () => (
  <TextField type="text" label="Name" error="Invalid value" />
)

export const mascaraText = () => (
  <TextField label="Text" type="text" largeLabel />
)

export const materialText = () => (
  <TextField label="Text" type="text" theme="material" />
)

export const materialPassword = () => (
  <TextField label="Password" type="password" theme="material" />
)

export const materialError = () => (
  <TextField type="text" label="Name" error="Invalid value" theme="material" />
)
