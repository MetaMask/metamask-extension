import React from 'react';
import TruncatedDefinitionList from './truncated-definition-list';

export default {
  title: 'Components/UI/TruncatedDefinitionList',

  argTypes: {
    title: {
      control: 'text',
    },
    dictionary: {
      control: 'object',
    },
    prefaceKeys: {
      control: 'object',
    },
  },
  args: {
    title: 'Basic definitions',
  },
};

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

export const DefaultStory = (args) => <TruncatedDefinitionList {...args} />;

DefaultStory.storyName = 'Default';

DefaultStory.args = {
  dictionary: basic,
  prefaceKeys: ['term', 'definition'],
};

export const WithTooltips = (args) => <TruncatedDefinitionList {...args} />;

WithTooltips.args = {
  dictionary: advanced,
  tooltips,
  prefaceKeys: ['Chain ID'],
};
