import React from 'react';
import { 
  Box, 
  Text, 
  Button, 
  ButtonVariant,
  Icon,
  IconName,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';

/**
 * Tailwind CSS Test Component
 * 
 * This component demonstrates proper usage of Tailwind CSS classes
 * with MetaMask Design System components. Use this to verify:
 * 
 * 1. VSCode IntelliSense is working (autocomplete on className)
 * 2. ESLint rules are applied correctly
 * 3. Design system integration works properly
 * 
 * To test IntelliSense:
 * - Type className="text-" and see if suggestions appear
 * - Hover over existing classes to see their CSS properties
 * - Check that invalid classes are highlighted
 */
const TailwindTestComponent = () => {
  return (
    <Box className="min-h-screen bg-alternative p-4">
      {/* Container with responsive design */}
      <Box className="mx-auto max-w-2xl">
        
        {/* Header */}
        <Box className="mb-8">
          <Text className="text-3xl font-bold text-center mb-4">
            Tailwind CSS Test
          </Text>
          <Text className="text-center text-alternative">
            This component tests Tailwind CSS integration with MetaMask Design System
          </Text>
        </Box>

        {/* Grid Layout */}
        <Box className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          
          {/* Card 1 */}
          <Box className="bg-default p-6 rounded-lg border border-muted shadow-sm">
            <Box className="flex items-center mb-4">
              <Icon 
                name={IconName.Info} 
                className="mr-2 text-primary-default" 
              />
              <Text className="text-lg font-semibold">Information</Text>
            </Box>
            <Text className="text-alternative mb-4">
              This card demonstrates proper spacing, colors, and layout using Tailwind utilities.
            </Text>
            <Button 
              variant={ButtonVariant.Primary}
              className="w-full"
            >
              Learn More
            </Button>
          </Box>

          {/* Card 2 */}
          <Box className="bg-default p-6 rounded-lg border border-muted shadow-sm">
            <Box className="flex items-center mb-4">
              <Icon 
                name={IconName.Star} 
                className="mr-2 text-warning-default" 
              />
              <Text className="text-lg font-semibold">Features</Text>
            </Box>
            <Text className="text-alternative mb-4">
              Responsive design, consistent spacing, and proper color usage.
            </Text>
            <Button 
              variant={ButtonVariant.Secondary}
              className="w-full"
            >
              View Features
            </Button>
          </Box>
        </Box>

        {/* Action Bar */}
        <Box className="flex flex-col sm:flex-row gap-4 p-4 bg-muted rounded-lg">
          <Box className="flex-1">
            <Text className="font-medium mb-2">Quick Actions</Text>
            <Text className="text-sm text-alternative">
              Test different states and interactions
            </Text>
          </Box>
          <Box className="flex gap-2">
            <Button size="sm" className="hover:scale-105 transition-transform">
              Action 1
            </Button>
            <Button 
              variant={ButtonVariant.Secondary}
              size="sm" 
              className="hover:scale-105 transition-transform"
            >
              Action 2
            </Button>
          </Box>
        </Box>

        {/* Status List */}
        <Box className="mt-8">
          <Text className="text-xl font-semibold mb-4">Integration Status</Text>
          <Box className="space-y-2">
            
            <Box className="flex items-center justify-between p-3 bg-success-muted rounded border-l-4 border-success-default">
              <Text className="font-medium">Tailwind CSS Integration</Text>
              <Text className="text-success-default font-semibold">✓ Active</Text>
            </Box>
            
            <Box className="flex items-center justify-between p-3 bg-success-muted rounded border-l-4 border-success-default">
              <Text className="font-medium">Design System Components</Text>
              <Text className="text-success-default font-semibold">✓ Working</Text>
            </Box>
            
            <Box className="flex items-center justify-between p-3 bg-warning-muted rounded border-l-4 border-warning-default">
              <Text className="font-medium">ESLint Rules</Text>
              <Text className="text-warning-default font-semibold">⚠ Manual Setup</Text>
            </Box>
            
            <Box className="flex items-center justify-between p-3 bg-info-muted rounded border-l-4 border-info-default">
              <Text className="font-medium">VSCode IntelliSense</Text>
              <Text className="text-info-default font-semibold">ℹ Extension Required</Text>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
};

export default TailwindTestComponent;