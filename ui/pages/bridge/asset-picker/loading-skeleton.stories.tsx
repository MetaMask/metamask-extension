import React from 'react';
import { LoadingSkeleton } from './loading-skeleton';

const storybook = {
  title: 'Pages/Bridge/AssetPicker',
  component: LoadingSkeleton,
};

export const LoadingSkeletonStory = () => {
  return (
    <>
      <LoadingSkeleton isLoading={true} />
    </>
  );
};

LoadingSkeletonStory.storyName = 'LoadingSkeleton';

export default storybook;
