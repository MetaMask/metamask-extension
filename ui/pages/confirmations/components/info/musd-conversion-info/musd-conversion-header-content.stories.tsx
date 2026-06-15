import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextVariant,
} from '@metamask/design-system-react';
import { useMusdConversionHeaderContent } from './musd-conversion-header-content';

function MusdConversionHeaderContentDemo() {
  const { title, endAccessory } = useMusdConversionHeaderContent();
  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Between}
      gap={2}
    >
      <Text variant={TextVariant.HeadingSm}>{title}</Text>
      {endAccessory}
    </Box>
  );
}

const meta: Meta<typeof MusdConversionHeaderContentDemo> = {
  title:
    'Pages/Confirmations/Components/Info/MusdConversionInfo/MusdConversionHeaderContent',
  component: MusdConversionHeaderContentDemo,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Renders the header title and info tooltip for mUSD conversion confirmations. The title displays the APY bonus and the end accessory is a popover tooltip with bonus details.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof MusdConversionHeaderContentDemo>;

export const DefaultStory: Story = {};

DefaultStory.storyName = 'Default';
