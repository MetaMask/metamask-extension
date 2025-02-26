import React from 'react';
import { Box, Text } from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextVariant,
  TextColor,
} from '../../../helpers/constants/design-system';
import { useRecentPetNames } from '../../../ducks/sample/recent-petnames';
import { PetNameListItem } from './pet-name-list-item';

// Component for the content inside the card
function RecentPetNamesContent() {
  const { recentPetNames } = useRecentPetNames();

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={AlignItems.center}
      gap={4}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={2}
        style={{ width: '100%', minWidth: '300px' }}
      >
        {recentPetNames.length === 0 ? (
          <Text color={TextColor.textAlternative}>
            No recent pet names added yet
          </Text>
        ) : (
          recentPetNames.map(({ address, name, chainId }) => (
            <PetNameListItem
              key={`${chainId}-${address}`}
              name={name}
              address={address}
              chainId={chainId}
            />
          ))
        )}
      </Box>
    </Box>
  );
}

// The main component that includes the Card wrapper
export function SampleRecentPetNames() {
  return (
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Recent Pet Names</Text>
        <RecentPetNamesContent />
      </Box>
    </Card>
  );
}

// Export the content component separately
SampleRecentPetNames.RecentPetNamesContent = RecentPetNamesContent;
