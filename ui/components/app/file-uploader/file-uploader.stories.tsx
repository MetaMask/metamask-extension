import React from 'react';
import { FileUploader } from './file-uploader';

export default {
  title: 'Components/App/FileUploader',
  component: FileUploader,
};

export const DefaultStory = () => {
  return <FileUploader />;
};

DefaultStory.storyName = 'Default';
