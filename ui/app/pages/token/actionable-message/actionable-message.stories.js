import React from 'react'
import { action } from '@storybook/addon-actions'
import { text, boolean } from '@storybook/addon-knobs/react'
import ActionableMessage from '.'

export default {
  title: 'ActionableMessage',
}

export const NoAction = () => (
  <div style={{ height: '200px', width: '200px' }}>
    <ActionableMessage
      shown={boolean('Shown', true)}
      message={text('Message', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')}
    />
  </div>
)

export const OneAction = () => (
  <div style={{ height: '200px', width: '250px' }}>
    <ActionableMessage
      shown={boolean('Shown', true)}
      message={text('Message', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')}
      actions={[
        {
          label: text('ActionLabel', 'Dismiss'),
          onClick: action('OneAction Click'),
        },
      ]}
    />
  </div>
)

export const TwoActionsWithClassNames = () => (
  <div style={{ height: '200px', width: '300px' }}>
    <ActionableMessage
      shown={boolean('Shown', true)}
      message={text('Message', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')}
      actions={[
        {
          label: text('First ActionLabel', 'Dismiss'),
          onClick: action('TwoActionsWithClassNames Click 1'),
          actionClassName: 'text-transform-uppercase',
        },
        {
          label: text('Second ActionLabel', 'okay'),
          onClick: action('TwoActionsWithClassNames Click 2'),
          actionClassName: 'text-transform-uppercase',
        },
      ]}
    />
  </div>
)

export const OneActionWithAClass = () => (
  <div style={{ height: '200px', width: '350px' }}>
    <ActionableMessage
      shown={boolean('Shown', true)}
      message={text('Message', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.')}
      actions={[
        {
          label: text('ActionLabel', 'Dismiss'),
          onClick: action('OneActionWithAClass Click'),
        },
      ]}
      className="actionable-message--warning"
    />
  </div>
)
