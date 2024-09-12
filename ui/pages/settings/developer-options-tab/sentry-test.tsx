import React, { useState, useCallback, ReactElement } from 'react';
import { ButtonVariant } from '@metamask/snaps-sdk';
import {
  Box,
  Button,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { trace, TraceName } from '../../../../shared/lib/trace';

export function SentryTest() {
  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Sentry
      </Text>
      <div className="settings-page__content-padded">
        <GenerateUIError />
        <GenerateBackgroundError />
        <GenerateTrace />
      </div>
    </>
  );
}

function GenerateUIError() {
  const handleClick = useCallback(async () => {
    await window.stateHooks.throwTestError?.('Developer Options');
  }, []);

  return (
    <TestButton
      name="Generate UI Error"
      description={
        <span>
          Generate an unhandled <b>TestError</b> in this window.
        </span>
      }
      onClick={handleClick}
      expectError
    />
  );
}

function GenerateBackgroundError() {
  const handleClick = useCallback(async () => {
    await window.stateHooks.throwTestBackgroundError?.('Developer Options');
  }, []);

  return (
    <TestButton
      name="Generate Background Error"
      description={
        <span>
          Generate an unhandled <b>TestError</b> in the service worker.
        </span>
      }
      onClick={handleClick}
      expectError
    />
  );
}

function GenerateTrace() {
  const handleClick = useCallback(async () => {
    await trace(
      {
        name: TraceName.DeveloperTest,
        data: { 'test.data.number': 123 },
        tags: { 'test.tag.number': 123 },
      },
      async (context) => {
        await trace(
          {
            name: TraceName.NestedTest1,
            data: { 'test.data.boolean': true },
            tags: { 'test.tag.boolean': true },
            parentContext: context,
          },
          () => sleep(1000),
        );

        await trace(
          {
            name: TraceName.NestedTest2,
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
      name="Generate Trace"
      description={
        <span>
          Generate a <b>Developer Test</b> Sentry trace.
        </span>
      }
      onClick={handleClick}
    />
  );
}

function TestButton({
  name,
  description,
  onClick,
  expectError,
}: {
  name: string;
  description: ReactElement;
  onClick: () => Promise<void>;
  expectError?: boolean;
}) {
  const [isComplete, setIsComplete] = useState(false);

  const handleClick = useCallback(async () => {
    let hasError = false;

    try {
      await onClick();
    } catch (error) {
      hasError = true;
      throw error;
    } finally {
      if (expectError || !hasError) {
        setIsComplete(true);
      }
    }
  }, [onClick]);

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
        <Button variant={ButtonVariant.Primary} onClick={handleClick}>
          {name}
        </Button>
      </div>
      <div className="settings-page__content-item-col">
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          paddingLeft={2}
          paddingRight={2}
          style={{ height: '40px', width: '40px' }}
        >
          <Icon
            className="settings-page-developer-options__icon-check"
            name={IconName.Check}
            color={IconColor.successDefault}
            size={IconSize.Lg}
            hidden={!isComplete}
          />
        </Box>
      </div>
    </Box>
  );
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
