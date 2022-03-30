import React from 'react';
import TruncatedDefinitionList from './truncated-definition-list';

export default {
  title: 'Components/UI/TruncatedDefinitionList',
  id: __filename,
  argTypes: {
    title: { control: 'text', defaultValue: 'Basic definitions' },
  },
};

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

export const DefaultStory = (args) => <TruncatedDefinitionList {...args} />;

DefaultStory.argTypes = {
  dictionary: {
    control: 'object',
    defaultValue: basic,
  },
  prefaceKeys: {
    control: 'object',
    defaultValue: ['term', 'definition'],
  },
};

DefaultStory.storyName = 'Default';

export const WithTooltips = (args) => <TruncatedDefinitionList {...args} />;

WithTooltips.argTypes = {
  dictionary: {
    control: 'object',
    defaultValue: advanced,
  },
  tooltips: {
    control: 'object',
    defaultValue: tooltips,
  },
  prefaceKeys: {
    control: 'array',
    defaultValue: ['Chain ID'],
  },
};
