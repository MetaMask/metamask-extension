import React from 'react';
import {
  COLORS,
  SIZES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import DefinitionList from './definition-list';

const basic = {
  term:
    'a word or phrase used to describe a thing or to express a concept, especially in a particular kind of language or branch of study.',
  definition:
    'a statement of the exact meaning of a word, especially in a dictionary.',
  dl: 'HTML tag denoting a definition list',
  dt: 'HTML tag denoting a definition list term',
  dd: 'HTML tag denoting a definition list definition',
};

const advanced = {
  'Network Name': 'Ethereum Mainnet',
  'Chain ID': '1',
  Ticker: 'ETH',
};

const tooltips = {
  'Network Name': 'The name that is associated with this network',
  'Chain ID': 'The numeric value representing the ID of this network',
  Ticker: 'The currency symbol of the primary currency for this network',
};

export default {
  title: 'Components/UI/DefinitionList',
  id: __filename,
  argTypes: {
    dictionary: { control: 'object', name: 'Dictionary' },
    gapSize: {
      control: 'select',
      name: 'Gap Size',
      options: SIZES,
      defaultValue: SIZES.SM,
    },
    tooltips: { control: 'object', name: 'Tooltips' },
    termTypography: {
      name: 'Term Typography',
      variant: {
        control: 'select',
        name: 'Term Variant',
        options: TYPOGRAPHY,
      },
      color: {
        control: 'select',
        name: 'Term Color',
        options: COLORS,
      },
    },
    definitionTypography: {
      name: 'Definition Typography',
      variant: {
        control: 'select',
        name: 'Definition Variant',
        options: TYPOGRAPHY,
      },
      color: {
        control: 'select',
        name: 'Term Color',
        options: COLORS,
      },
    },
  },
  args: {
    dictionary: basic,
    tooltips,
    termTypography: {
      variant: TYPOGRAPHY.H6,
      color: COLORS.TEXT_DEFAULT,
    },
    definitionTypography: {
      variant: TYPOGRAPHY.H6,
      color: COLORS.TEXT_DEFAULT,
    },
  },
};

export const DefaultStory = (args) => (
  <DefinitionList dictionary={args.dictionary} gapSize={args.gapSize} />
);

DefaultStory.storyName = 'Default';

export const WithTooltips = (args) => (
  <DefinitionList
    dictionary={args.dictionary}
    tooltips={args.tooltips}
    gapSize={args.gapSize}
  />
);

WithTooltips.args = {
  dictionary: advanced,
};

export const WithTypographyControl = (args) => (
  <DefinitionList
    dictionary={args.dictionary}
    tooltips={args.tooltips}
    gapSize={args.gapSize}
    termTypography={{
      variant: args.termTypography.variant,
      color: args.termTypography.color,
    }}
    definitionTypography={{
      variant: args.definitionTypography.variant,
      color: args.definitionTypography.color,
    }}
  />
);

WithTypographyControl.args = {
  dictionary: advanced,
};
