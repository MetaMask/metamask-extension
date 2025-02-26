import React, { useState } from 'react';
import { Box, Text, ButtonBase } from '../../../components/component-library';
import Card from '../../../components/ui/card';
import {
  Display,
  FlexDirection,
  AlignItems,
  TextVariant,
  JustifyContent,
  BorderRadius,
  BackgroundColor,
  TextColor,
} from '../../../helpers/constants/design-system';
import { SamplePetNames } from './sample-pet-names';
import { SampleRecentPetNames } from './sample-recent-petnames';

const TABS = {
  CURRENT_CHAIN: 'current',
  RECENT: 'recent',
};

export function SamplePetNamesContainer() {
  const [activeTab, setActiveTab] = useState(TABS.CURRENT_CHAIN);

  return (
    <Card>
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        gap={4}
      >
        <Text variant={TextVariant.headingSm}>Pet Names</Text>

        {/* Tab Navigation */}
        <Box
          display={Display.Flex}
          justifyContent={JustifyContent.center}
          gap={2}
          style={{ width: '100%' }}
        >
          <TabButton
            isActive={activeTab === TABS.CURRENT_CHAIN}
            onClick={() => setActiveTab(TABS.CURRENT_CHAIN)}
            label="Current Chain"
          />
          <TabButton
            isActive={activeTab === TABS.RECENT}
            onClick={() => setActiveTab(TABS.RECENT)}
            label="Recent Names"
          />
        </Box>

        {/* Tab Content */}
        <Box style={{ width: '100%' }}>
          {activeTab === TABS.CURRENT_CHAIN ? (
            <SamplePetNamesContent />
          ) : (
            <SampleRecentPetNamesContent />
          )}
        </Box>
      </Box>
    </Card>
  );
}

// Helper components to avoid Card nesting
function SamplePetNamesContent() {
  // This component renders the content of SamplePetNames but without the Card wrapper
  const { PetNamesContent } = SamplePetNames;
  return <PetNamesContent />;
}

function SampleRecentPetNamesContent() {
  // This component renders the content of SampleRecentPetNames but without the Card wrapper
  const { RecentPetNamesContent } = SampleRecentPetNames;
  return <RecentPetNamesContent />;
}

interface TabButtonProps {
  isActive: boolean;
  onClick: () => void;
  label: string;
}

function TabButton({ isActive, onClick, label }: TabButtonProps) {
  return (
    <ButtonBase
      onClick={onClick}
      style={{
        padding: '8px 16px',
        borderRadius: '16px',
        backgroundColor: isActive
          ? BackgroundColor.primaryMuted
          : 'transparent',
        transition: 'background-color 0.2s ease',
      }}
    >
      <Text
        color={isActive ? TextColor.primaryDefault : TextColor.textAlternative}
        variant={TextVariant.bodyMd}
      >
        {label}
      </Text>
    </ButtonBase>
  );
}
