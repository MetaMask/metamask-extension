import React from 'react'
import { object } from '@storybook/addon-knobs'
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system'
import MetaMaskTemplateRenderer from '.'

export default {
  title: 'MetaMask Template Renderer',
}

const SECTIONS = [
  {
    element: 'Box',
    props: {
      margin: 4,
      padding: 8,
      borderColor: COLORS.PRIMARY1,
      borderWidth: 2,
    },
    children: [
      {
        element: 'Typography',
        children: 'A Test String',
        props: {
          color: COLORS.UI3,
          variant: TYPOGRAPHY.H2,
        },
      },
      {
        element: 'Typography',
        children: 'Some more text as a paragraph',
        props: {
          color: COLORS.UI4,
          variant: TYPOGRAPHY.Paragraph,
        },
      },
      {
        element: 'TruncatedDefinitionList',
        props: {
          dictionary: {
            term:
              'a word or phrase used to describe a thing or to express a concept, especially in a particular kind of language or branch of study.',
            definition:
              'a statement of the exact meaning of a word, especially in a dictionary.',
            dl: 'HTML tag denoting a definition list',
            dt: 'HTML tag denoting a definition list term',
            dd: 'HTML tag denoting a definition list definition',
          },
          prefaceKeys: ['term', 'definition'],
        },
      },
      {
        element: 'Box',
        children: [
          {
            element: 'Button',
            children: 'Cancel',
            props: {
              rounded: true,
              type: 'outlined',
              style: {
                width: '45%',
              },
            },
          },
          {
            element: 'Button',
            children: 'OK',
            props: {
              rounded: true,
              type: 'primary',
              style: {
                width: '45%',
              },
            },
          },
        ],
        props: { justifyContent: 'space-between', padding: [0, 4] },
      },
    ],
  },
]

export const metaMaskTemplateRenderer = () => (
  <MetaMaskTemplateRenderer sections={object('sections', SECTIONS)} />
)

export const withInvalidElement = () => (
  <MetaMaskTemplateRenderer
    sections={object('sections', [
      ...SECTIONS,
      {
        element: 'Unsafe',
        children:
          'I should be displayed, but I wont be due to unsafe component',
      },
    ])}
  />
)
