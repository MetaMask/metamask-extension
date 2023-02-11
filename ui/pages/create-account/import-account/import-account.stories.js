import React from 'react';
import Box from '../../../components/ui/box';
import NewAccountImportForm from '.';

export default {
  title: 'Pages/CreateAccount/ImportAccount',
};

export const DefaultStory = (args) => {
  return (
    <Box className="new-account">
      <NewAccountImportForm {...args} />
    </Box>
  );
};

DefaultStory.storyName = 'Default';
