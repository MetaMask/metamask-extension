import React, { useState } from 'react';
import { Provider } from 'react-redux';
import configureStore from '../../../../store/store';
import testData from '../../../../../.storybook/test-data';
import SnapListTab from './snap-list-tab';

// Using Test Data For Redux
const store = configureStore(testData);

export default {
  title: 'Pages/Settings/SnapListTab',

  decorators: [(story) => <Provider store={store}>{story()}</Provider>],
  argTypes: {
    onToggle: {
      action: 'onToggle',
    },
    onRemove: {
      action: 'onRemove',
    },
  },
};
export const DefaultStory = (args) => {
  const state = store.getState();
  const [viewingSnap, setViewingSnap] = useState();
  const [snap, setSnap] = useState();

  return (
    <div>
      <SnapListTab
        {...args}
        snaps={state.metamask.snaps}
        viewingSnap={viewingSnap}
        currentSnap={snap}
        onToggle={args.onToggle}
        onRemove={args.onRemove}
        onClick={(_, s) => {
          setSnap(s);
          setViewingSnap(true);
        }}
      />
    </div>
  );
};
const state = store.getState();
DefaultStory.args = {
  snaps: state.metamask.snaps,
  viewingSnap: false,
};
DefaultStory.storyName = 'Default';
