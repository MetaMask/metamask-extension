import React from 'react';
import ErrorPage from './error-page.component';

export default {
  title: 'Pages/ErrorPage',
  component: ErrorPage,
};

export const DefaultStory = () => (
  <ErrorPage
    error={{
      message: 'Something went wrong',
      name: 'Error',
      stack: 'Error: Something went wrong\n    at App (app.tsx:42)',
    }}
  />
);

DefaultStory.storyName = 'Default';
