import React from 'react';
import EditGasDisplayEducation from '.';

export default {
  title: 'Components/App/EditGasDisplayEducation',
  id: __filename,
};

export const DefaultStory = () => {
  return (
    <div style={{ width: '600px' }}>
      <EditGasDisplayEducation />
    </div>
  );
};

DefaultStory.storyName = 'Default';
