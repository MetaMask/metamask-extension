import React, { ReactElement } from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import { Box, Button, Text } from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useCallback } from 'react';
import { trace } from '../../../../shared/lib/performance';

export function SentryTest() {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Sentry
      </Text>
      <div className="settings-page__content-padded">
        <GenerateError />
        <CreateTransaction />
      </div>
    </>
  );
}

function GenerateError() {
  const handleGenerateErrorClick = useCallback(() => {
    throw new Error('Developer Test');
  }, []);

  return (
    <TestButton
      name="Generate Error"
      description={
        <>
          Generate a <b>Developer Test</b> error.
        </>
      }
      onClick={handleGenerateErrorClick}
    />
  );
}

function CreateTransaction() {
  const handleGenerateTransactionClick = useCallback(async () => {
    await trace(
      {
        name: 'Developer Test',
        data: { 'test.data.number': 123 },
        tags: { 'test.tag.number': 123 },
      },
      async (context) => {
        await trace(
          {
            name: 'Nested Test 1',
            data: { 'test.data.boolean': true },
            tags: { 'test.tag.boolean': true },
            parentContext: context,
          },
          () => sleep(1000),
        );

        await trace(
          {
            name: 'Nested Test 2',
            data: { 'test.data.string': 'test' },
            tags: { 'test.tag.string': 'test' },
            parentContext: context,
          },
          () => sleep(500),
        );
      },
    );
  }, []);

  return (
    <TestButton
      name="Create Transaction"
      description={
        <>
          Generate a <b>Developer Test</b> Sentry transaction.
        </>
      }
      onClick={handleGenerateTransactionClick}
    />
  );
}

function TestButton({
  name,
  description,
  onClick,
}: {
  name: string;
  description: ReactElement;
  onClick: () => void;
}) {
  return (
    <Box
      className="settings-page__content-row"
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.spaceBetween}
      gap={4}
    >
      <div className="settings-page__content-item">
        <div className="settings-page__content-description">{description}</div>
      </div>
      <div className="settings-page__content-item-col">
        <Button variant={ButtonVariant.Primary} onClick={onClick}>
          {name}
        </Button>
      </div>
    </Box>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
