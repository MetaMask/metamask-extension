import React from 'react';
import { Box, BoxAlignItems, BoxFlexDirection } from '@metamask/design-system-react';
import { useMusdConversionHeaderContent } from './musd-conversion-header-content';

const Story = {
  title: 'Confirmations/Components/Info/MusdConversionHeaderContent',
  component: () => null,
};

export default Story;

function HeaderContentPreview() {
  const { title, endAccessory } = useMusdConversionHeaderContent();
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      gap={2}
    >
      <span>{title}</span>
      {endAccessory}
    </Box>
  );
}

export const DefaultStory = () => <HeaderContentPreview />;
DefaultStory.storyName = 'Default';
