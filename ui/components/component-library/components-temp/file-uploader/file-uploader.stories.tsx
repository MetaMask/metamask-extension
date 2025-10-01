import React from 'react';
import { FileUploader } from './file-uploader';

export default {
  title: 'Components/App/FileUploader',
  component: FileUploader,
  argTypes: {
    label: {
      control: 'text',
    },
    helpText: {
      control: 'text',
    },
    acceptText: {
      control: 'text',
    },
    multiple: {
      control: 'boolean',
    },
  },
  args: {
    label: 'Upload files',
    helpText: 'Upload files description',
    acceptText: 'List of accepted file types',
    multiple: true,
  },
};

export const DefaultStory = (args) => {
  return <FileUploader {...args} />;
};

DefaultStory.storyName = 'Default';
