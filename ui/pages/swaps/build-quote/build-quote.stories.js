import React from 'react';
import { shuffle } from 'lodash';
import testData from '../../../../.storybook/test-data';
import BuildQuote from './build-quote';

const tokenValuesArr = shuffle(testData.metamask.tokenList);

export default {
  title: 'Pages/Swaps/BuildQuote',

  argTypes: {
    ethBalance: {
      control: { type: 'text' },
    },
    selectedAccountAddress: {
      control: { type: 'text' },
    },
    shuffledTokensList: { control: 'object' },
  },
  args: {
    ethBalance: '0x8',
    selectedAccountAddress: '0xb19ac54efa18cc3a14a5b821bfec73d284bf0c5e',
    shuffledTokensList: tokenValuesArr,
  },
};

export const DefaultStory = (args) => {
  return (
    <>
      <BuildQuote {...args} />
    </>
  );
};

DefaultStory.storyName = 'Default';
