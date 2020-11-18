import React from 'react'
import { action } from '@storybook/addon-actions'
import { boolean, select, text } from '@storybook/addon-knobs/react'
import Dropdown from '.'

export default {
  title: 'Dropdown',
}

const unnamedOptions = [...Array(10).keys()].map((index) => {
  return { value: `option${index}` }
})

const namedOptions = unnamedOptions.map((option, index) => {
  return { ...option, name: `Option ${index}` }
})

const namedOptionsWithVeryLongNames = unnamedOptions.map((option, index) => {
  return {
    ...option,
    name: `Option ${index} with a very${', very'.repeat(index)} long name`,
  }
})

export const simple = () => (
  <Dropdown
    disabled={boolean('Disabled', false)}
    title={text('Title', 'Test dropdown name')}
    onChange={action('Selection changed')}
    options={namedOptions}
    required={boolean('Required', false)}
    selectedOption={select(
      'Selected Option',
      namedOptions.map((option) => option.value),
      namedOptions[0].value,
    )}
  />
)

export const optionsWithoutNames = () => (
  <Dropdown
    disabled={boolean('Disabled', false)}
    title={text('Title', 'Test dropdown name')}
    onChange={action('Selection changed')}
    options={unnamedOptions}
    required={boolean('Required', false)}
    selectedOption={select(
      'Selected Option',
      unnamedOptions.map((option) => option.value),
      unnamedOptions[0].value,
    )}
  />
)

export const optionsWithLongNames = () => (
  <Dropdown
    disabled={boolean('Disabled', false)}
    title={text('Title', 'Test dropdown name')}
    onChange={action('Selection changed')}
    options={namedOptionsWithVeryLongNames}
    required={boolean('Required', false)}
    selectedOption={select(
      'Selected Option',
      namedOptionsWithVeryLongNames.map((option) => option.value),
      namedOptionsWithVeryLongNames[0].value,
    )}
  />
)

export const optionsWithLongNamesAndShortWidth = () => (
  <Dropdown
    disabled={boolean('Disabled', false)}
    title={text('Title', 'Test dropdown name')}
    onChange={action('Selection changed')}
    options={namedOptionsWithVeryLongNames}
    required={boolean('Required', false)}
    selectedOption={select(
      'Selected Option',
      namedOptionsWithVeryLongNames.map((option) => option.value),
      namedOptionsWithVeryLongNames[0].value,
    )}
    style={{ width: '200px' }}
  />
)
