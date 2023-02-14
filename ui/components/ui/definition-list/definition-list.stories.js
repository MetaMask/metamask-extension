import React from 'react';
import {
  Size,
  TextColor,
  TypographyVariant,
} from '../../../helpers/constants/design-system';
import DefinitionList from './definition-list';

const basic = {
  term: 'a word or phrase used to describe a thing or to express a concept, especially in a particular kind of language or branch of study.',
  definition:
    'a statement of the exact meaning of a word, especially in a dictionary.',
  dl: 'HTML tag denoting a definition list',
  dt: 'HTML tag denoting a definition list term',
  dd: 'HTML tag denoting a definition list definition',
};

const advanced = {
  'Network name': 'Ethereum Mainnet',
  'Chain ID': '1',
  Ticker: 'ETH',
};

const tooltips = {
  'Network name': 'The name that is associated with this network',
  'Chain ID': 'The numeric value representing the ID of this network',
  Ticker: 'The currency symbol of the primary currency for this network',
};

export default {
  title: 'Components/UI/DefinitionList',

  argTypes: {
    dictionary: { control: 'object', name: 'Dictionary' },
    gapSize: {
      control: 'select',
      name: 'Gap Size',
      options: Object.values(Size),
    },
  },
  args: {
    dictionary: basic,
    gapSize: Size.SM,
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
  tooltips,
};
WithTooltips.argTypes = {
  tooltips: { control: 'object', name: 'Tooltips' },
};

export const WithTypographyControl = (args) => (
  <DefinitionList
    dictionary={args.dictionary}
    tooltips={args.tooltips}
    gapSize={args.gapSize}
    termTypography={{
      variant: args.termTypographyVariant,
      color: args.termTypographyColor,
      children: <div />,
    }}
    definitionTypography={{
      variant: args.definitionTypographyVariant,
      color: args.definitionTypographyColor,
      children: <div />,
    }}
  />
);

WithTypographyControl.args = {
  dictionary: advanced,
  termTypographyVariant: TypographyVariant.H6,
  termTypographyColor: TextColor.textDefault,
  definitionTypographyVariant: TypographyVariant.H6,
  definitionTypographyColor: TextColor.textDefault,
};

WithTypographyControl.argTypes = {
  tooltips,
  termTypographyVariant: {
    control: 'select',
    name: 'Term Variant',
    options: Object.values(TypographyVariant),
  },
  termTypographyColor: {
    control: 'select',
    name: 'Term Color',
    options: Object.values(TextColor),
  },
  definitionTypographyVariant: {
    control: 'select',
    name: 'Definition Variant',
    options: Object.values(TypographyVariant),
  },
  definitionTypographyColor: {
    control: 'select',
    name: 'Definition Color',
    options: Object.values(TextColor),
  },
};
