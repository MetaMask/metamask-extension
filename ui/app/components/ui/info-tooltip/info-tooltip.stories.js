import React from 'react'
import { text } from '@storybook/addon-knobs/react'
import InfoTooltip from './info-tooltip'

export default {
  title: 'InfoTooltip',
}

export const Top = () => (
  <InfoTooltip
    position="top"
    contentText={text('top', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)

export const Bottom = () => (
  <InfoTooltip
    position="bottom"
    contentText={text('bottom', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)

export const Left = () => (
  <InfoTooltip
    position="left"
    contentText={text('left', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)

export const Right = () => (
  <InfoTooltip
    position="right"
    contentText={text('right', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)

export const Wide = () => (
  <InfoTooltip
    theme="wide"
    position="top"
    contentText={text('wide', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)

export const ExtraWide = () => (
  <InfoTooltip
    theme="extraWide"
    position="top"
    contentText={text('extraWide', 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut gravida dictum diam et sagittis. Sed lorem arcu, consectetur consectetur et, lacinia hendrerit sapien.')}
  />
)
