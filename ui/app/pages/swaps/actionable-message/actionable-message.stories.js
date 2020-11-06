import React from 'react'
import { action } from '@storybook/addon-actions'
import { text } from '@storybook/addon-knobs/react'
import ActionableMessage from '.'

export default {
  title: 'ActionableMessage',
}

export const NoAction = () => (
  <div style={{ height: '200px', width: '200px' }}>
    <ActionableMessage
      message={text(
        'Message',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      )}
    />
  </div>
)

export const OneAction = () => (
  <div style={{ height: '200px', width: '250px' }}>
    <ActionableMessage
      message={text(
        'Message',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      )}
      primaryAction={{
        label: text('ActionLabel', 'Dismiss'),
        onClick: action('OneAction Click'),
      }}
    />
  </div>
)

export const TwoActions = () => (
  <div style={{ height: '200px', width: '300px' }}>
    <ActionableMessage
      message={text(
        'Message',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      )}
      primaryAction={{
        label: text('First ActionLabel', 'Dismiss'),
        onClick: action('TwoActionsWithClassNames Click 1'),
      }}
      secondaryAction={{
        label: text('Second ActionLabel', 'Okay'),
        onClick: action('TwoActionsWithClassNames Click 2'),
      }}
      className="actionable-message--warning"
    />
  </div>
)

export const LeftAligned = () => (
  <div style={{ height: '200px', width: '300px' }}>
    <ActionableMessage
      message={text(
        'Message',
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
      )}
      primaryAction={{
        label: text('LeftAligned Label', 'Dismiss'),
        onClick: action('LeftAligned Click 1'),
      }}
      className="actionable-message--left-aligned"
    />
  </div>
)
