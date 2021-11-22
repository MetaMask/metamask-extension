import React from 'react';
import { Provider } from 'react-redux';
import { action } from '@storybook/addon-actions';
import configureStore from '../../../store/store';
import testData from '../../../../.storybook/test-data';
import TokenSearch from './token-search.component';

const store = configureStore(testData);

export default {
  title: 'Pages/ImportToken/TokenSearch',
  id: __filename,
  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
};

export const TokenSearchComponent = () => {
  const state = store.getState();
  const { tokenList } = state.metamask;

  return (
    <TokenSearch
      onSearch={() => action(`Type Search Value`)()}
      tokenList={tokenList}
    />
  );
};
