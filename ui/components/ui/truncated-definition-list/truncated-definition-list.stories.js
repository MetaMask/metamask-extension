import React from 'react';
import { object, text } from '@storybook/addon-knobs';

import TruncatedDefinitionList from './truncated-definition-list';

export default {
  title: 'Truncated Definition List',
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
  'Ticker': 'ETH',
};

const tooltips = {
  'Network Name': 'The name that is associated with this network',
  'Chain ID': 'The numeric value representing the ID of this network',
  'Ticker': 'The currency symbol of the primary currency for this network',
};

export const truncatedDefinitionList = () => (
  <TruncatedDefinitionList
    dictionary={object('dictionary', basic)}
    title={text('title', 'Basic definitions')}
    prefaceKeys={object('prefaceKeys', ['term', 'definition'])}
  />
);

export const withTooltips = () => (
  <TruncatedDefinitionList
    dictionary={object('dictionary', advanced)}
    title={text('title', 'Network Details')}
    tooltips={object('tooltips', tooltips)}
    prefaceKeys={object('prefaceKeys', ['Chain ID'])}
  />
);
