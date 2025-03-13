import React, { useState, useCallback, ReactElement } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonVariant,
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
import { ButtonSize } from '../../../components/component-library/button/button.types';

import {
  forceUpdateMetamaskState,
  setCurrentLocale,
} from '../../../store/actions';
import { FALLBACK_LOCALE, fetchLocale } from '../../../../shared/modules/i18n';
import { getCurrentLocale } from '../../../ducks/locale/locale';

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const SentryTest = () => {
  const currentLocale: string =
    useSelector(getCurrentLocale) || FALLBACK_LOCALE;

  return (
    <>
      <Text className="settings-page__security-tab-sub-header__bold">
        Sentry
      </Text>
      <div className="settings-page__content-padded">
        <GenerateUIError />
        <GenerateBackgroundError />
        <GenerateTrace />
        <GeneratePageCrash currentLocale={currentLocale} />
      </div>
    </>
  );
};

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

function GeneratePageCrash({ currentLocale }: { currentLocale: string }) {
  const dispatch = useDispatch();
  const handleClick = async () => {
    const localeMessages = await fetchLocale(currentLocale);
    await dispatch(
      setCurrentLocale(currentLocale, {
        ...localeMessages,
        // @ts-expect-error - remove a language string in this page to trigger a page crash
        developerOptions: undefined,
      }),
    );
    await forceUpdateMetamaskState(dispatch);
  };

  return (
    <TestButton
      name="Generate A Page Crash"
      description={
        <span>
          Trigger the crash on extension to send user feedback to sentry. You
          can click "Try again" to reload extension
        </span>
      }
      onClick={handleClick}
      expectError
      testId="developer-options-generate-page-crash-button"
    />
  );
}

function TestButton({
  name,
  description,
  onClick,
  expectError,
  testId,
}: {
  name: string;
  description: ReactElement;
  onClick: () => Promise<void>;
  expectError?: boolean;
  testId?: string;
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
        <Button
          variant={ButtonVariant.Primary}
          onClick={handleClick}
          size={ButtonSize.Lg}
          data-testid={testId}
        >
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

export default SentryTest;
