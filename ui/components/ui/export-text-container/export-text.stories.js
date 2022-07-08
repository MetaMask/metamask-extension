import React from 'react';
import ExportTextContainer from '.';

export default {
  title: 'Components/UI/ExportTextContainer',
  id: __filename,
  component: ExportTextContainer,
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
