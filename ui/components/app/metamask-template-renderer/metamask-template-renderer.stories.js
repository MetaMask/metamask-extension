import React from 'react';
import { object } from '@storybook/addon-knobs';
import { COLORS, TYPOGRAPHY } from '../../../helpers/constants/design-system';
import MetaMaskTemplateRenderer from '.';

export default {
  title: 'Components/App/MetamaskTemplateRenderer',
};

const SECTIONS = {
  element: 'Box',
  props: {
    margin: 4,
    padding: 8,
    borderColor: COLORS.PRIMARY_DEFAULT,
    borderWidth: 2,
  },
  children: [
    {
      element: 'Typography',
      key: 'A Test String',
      children: 'A Test String',
      props: {
        color: COLORS.TEXT_MUTED,
        variant: TYPOGRAPHY.H2,
      },
    },
    {
      element: 'Typography',
      key: 'Some more text',
      children: 'Some more text as a paragraph',
      props: {
        color: COLORS.TEXT_ALTERNATIVE,
        variant: TYPOGRAPHY.Paragraph,
      },
    },
    {
      element: 'TruncatedDefinitionList',
      key: 'TDL',
      props: {
        dictionary: {
          term: 'a word or phrase used to describe a thing or to express a concept, especially in a particular kind of language or branch of study.',
          definition:
            'a statement of the exact meaning of a word, especially in a dictionary.',
          dl: 'HTML tag denoting a definition list',
          dt: 'HTML tag denoting a definition list term',
          dd: 'HTML tag denoting a definition list definition',
        },
        title: 'Full list',
        prefaceKeys: ['term', 'definition'],
      },
    },
    {
      element: 'Box',
      key: 'ActionsBox',
      children: [
        {
          element: 'Button',
          children: 'Cancel',
          key: 'cancel-button',
          props: {
            type: 'outlined',
            style: {
              width: '45%',
            },
          },
        },
        {
          element: 'Button',
          children: 'OK',
          key: 'ok-button',
          props: {
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
};

export const DefaultStory = () => (
  <MetaMaskTemplateRenderer sections={object('sections', SECTIONS)} />
);

DefaultStory.storyName = 'Default';

export const WithInvalidElement = () => (
  <MetaMaskTemplateRenderer
    sections={object('sections', [
      {
        ...SECTIONS,
        key: 'safe-tree',
      },
      {
        element: 'Unsafe',
        key: 'unsafe-tree',
        children:
          'I should be displayed, but I wont be due to unsafe component',
      },
    ])}
  />
);
