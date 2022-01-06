import React from 'react';
import TransactionTotalBanner from '.';

export default {
  title: 'Components/App/TransactionTotalBanner',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <TransactionTotalBanner
      total="~18.73"
      detail={
        <>
          Up to <strong>$19.81</strong> (0.01234 ETH)
        </>
      }
      timing="Very likely in < 15 seconds"
    />
  );
};

DefaultStory.storyName = 'Default';
