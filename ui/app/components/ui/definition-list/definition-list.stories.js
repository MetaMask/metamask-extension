import React from 'react';
import { object, select } from '@storybook/addon-knobs';
import {
  COLORS,
  SIZES,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import DefinitionList from './definition-list';

export default {
  title: 'Definition List',
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

export const definitionList = () => (
  <DefinitionList
    dictionary={object('dictionary', basic)}
    gapSize={select('gapSize', SIZES, SIZES.SM)}
  />
);

export const withTooltips = () => (
  <DefinitionList
    dictionary={object('dictionary', advanced)}
    tooltips={object('tooltips', tooltips)}
    gapSize={select('gapSize', SIZES, SIZES.SM)}
  />
);

export const withTypographyControl = () => (
  <DefinitionList
    dictionary={object('dictionary', advanced)}
    tooltips={object('tooltips', tooltips)}
    gapSize={select('gapSize', SIZES, SIZES.SM)}
    termTypography={{
      variant: select('termTypography.variant', TYPOGRAPHY, TYPOGRAPHY.H6),
      color: select('termTypography.color', COLORS, COLORS.BLACK),
    }}
    definitionTypography={{
      variant: select(
        'definitionTypography.variant',
        TYPOGRAPHY,
        TYPOGRAPHY.H6,
      ),
      color: select('definitionTypography.color', COLORS, COLORS.BLACK),
    }}
  />
);
