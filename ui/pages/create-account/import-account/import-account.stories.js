import React from 'react';
import NewAccountImportForm from '.';
import Box from '../../../components/ui/box';
import { _setBackgroundConnection } from '../../../store/action-queue';

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
