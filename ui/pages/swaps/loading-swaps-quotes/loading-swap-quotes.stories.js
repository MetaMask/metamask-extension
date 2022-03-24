import React from 'react';
import { action } from '@storybook/addon-actions';
import LoadingSwapsQuotes from './loading-swaps-quotes';
import { storiesMetadata } from './loading-swaps-quotes-stories-metadata';

export default {
  title: 'Components/Page/LoadingSwapQuotes',
  id: __filename,
};

export const DefaultStory = () => (
  <div className="swaps">
    <div className="swaps__container">
      <LoadingSwapsQuotes
        loadingComplete={false}
        onDone={action('Loading done')}
        aggregatorMetadata={storiesMetadata.totle}
      />
    </div>
  </div>
);
