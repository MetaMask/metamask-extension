import React from 'react';
import README from './README.mdx';
import ExportTextContainer from '.';

export default {
  title: 'Components/UI/ExportTextContainer',

  component: ExportTextContainer,
  parameters: {
    docs: {
      page: README,
    },
  },
  argsTypes: {
    text: {
      control: 'text',
    },
  },
};

export const DefaultExportTextContainer = (args) => {
  return <ExportTextContainer {...args} />;
};

DefaultExportTextContainer.storyName = 'Default';

DefaultExportTextContainer.args = {
  text: ' Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
};
