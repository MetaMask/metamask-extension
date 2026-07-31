import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import RampsTokenSelectionHeader from '../token-selection/components/ramps-token-selection-header';

type RampsSelectionPageProps = {
  title: string;
  onBack: () => void;
  testId: string;
  backButtonTestId?: string;
  children: React.ReactNode;
};

/**
 * Shared full-page shell for ramps selection screens (header + content).
 * @param options0
 * @param options0.title
 * @param options0.onBack
 * @param options0.testId
 * @param options0.backButtonTestId
 * @param options0.children
 */
export function RampsSelectionPage({
  title,
  onBack,
  testId,
  backButtonTestId,
  children,
}: RampsSelectionPageProps) {
  return (
    <Box
      className="flex h-full flex-col bg-background-default"
      flexDirection={BoxFlexDirection.Column}
      data-testid={testId}
    >
      <RampsTokenSelectionHeader
        title={title}
        onBack={onBack}
        backButtonTestId={backButtonTestId}
      />
      {children}
    </Box>
  );
}

type RampsSelectionCenteredMessageProps = {
  message: string;
};

/**
 * Centered status/message body used for error and empty selection states.
 * @param options0
 * @param options0.message
 */
export function RampsSelectionCenteredMessage({
  message,
}: RampsSelectionCenteredMessageProps) {
  return (
    <Box
      className="flex-1 px-4 py-8"
      flexDirection={BoxFlexDirection.Column}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      gap={2}
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {message}
      </Text>
    </Box>
  );
}
