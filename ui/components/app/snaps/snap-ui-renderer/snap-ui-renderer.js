import React, { memo, useCallback, useMemo, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Container } from '@metamask/snaps-sdk/jsx';

import { isEqual } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { getMemoizedInterface } from '../../../../selectors';
import { Box } from '../../../component-library';

import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import PulseLoader from '../../../ui/pulse-loader';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import { mapToExtensionCompatibleColor, mapToTemplate } from './utils';
import { COMPONENT_MAPPING } from './components';

// Component for tracking the number of re-renders
// DO NOT USE IN PRODUCTION
const PerformanceTracker = () => {
  const rendersRef = useRef(0);
  rendersRef.current += 1;

  return <span data-testid="performance" data-renders={rendersRef.current} />;
};

const LoadingSpinner = memo(function LoadingSpinner() {
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      width={BlockSize.Full}
    >
      <PulseLoader />
    </Box>
  );
});

const scrollReducer = (state, action) => {
  let hasReachedBottom;
  switch (action.type) {
    case 'MANUAL_SCROLL':
      hasReachedBottom = state.hasReachedBottom || action.isAtBottom;
      return {
        buttonsEnabled: hasReachedBottom,
        showArrow: !hasReachedBottom && action.isScrollable,
        hasReachedBottom,
      };
    case 'COMPLETE_SCROLL':
      return {
        buttonsEnabled: true,
        showArrow: false,
        hasReachedBottom: true,
      };
    default:
      return state;
  }
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
const SnapUIRendererComponent = ({
  snapId,
  isLoading = false,
  // This is a workaround while we have the prompt dialog type since we can't inject the SnapUIRenderer in the template renderer.
  isPrompt = false,
  inputValue,
  onInputChange,
  placeholder,
  interfaceId,
  useFooter = false,
  onCancel,
  contentBackgroundColor,
  PERF_DEBUG,
}) => {
  const t = useI18nContext();

  const interfaceState = useSelector(
    (state) => getMemoizedInterface(state, interfaceId),
    // We only want to update the state if the content has changed.
    // We do this to avoid useless re-renders.
    (oldState, newState) => isEqual(oldState.content, newState.content),
  );

  const content = useMemo(() => {
    const rawContent = interfaceState?.content;
    return rawContent?.type === 'Container' || !rawContent
      ? rawContent
      : Container({ children: rawContent });
  }, [interfaceState?.content]);

  const requireScroll = useMemo(
    () => Boolean(content?.props?.children?.[1]?.props?.requireScroll),
    [content?.props?.children],
  );

  const isProgrammaticScrollRef = useRef(false);

  const [scrollState, dispatch] = useReducer(scrollReducer, {
    isProgrammaticScroll: false,
    buttonsEnabled: !requireScroll,
    showArrow: false,
    hasReachedBottom: !requireScroll,
  });

  const { onScroll, scrollToBottom, isScrollable, ref } = useScrollRequired(
    [],
    {
      // Only enable the hook if we need to handle scroll events
      enabled: requireScroll,
      // This lets us batch state updates and avoid an unnecessary render
      onMeasure: ({ isScrollable: canScroll, hasMeasured }) => {
        if (!requireScroll || !hasMeasured) {
          return;
        }
        dispatch({
          type: 'MANUAL_SCROLL',
          isScrollable: canScroll,
          isAtBottom: !canScroll,
        });
      },
    },
  );

  const buttonsEnabled = useMemo(
    () => (requireScroll ? scrollState.buttonsEnabled : true),
    [requireScroll, scrollState.buttonsEnabled],
  );

  const handleScroll = useCallback(
    (e) => {
      if (!requireScroll) {
        return;
      }

      const isActuallyAtBottom =
        Math.abs(
          e.target.scrollTop + e.target.clientHeight - e.target.scrollHeight,
        ) < 2;

      if (isProgrammaticScrollRef.current && isActuallyAtBottom) {
        isProgrammaticScrollRef.current = false;
        dispatch({ type: 'COMPLETE_SCROLL' });
      } else {
        dispatch({
          type: 'MANUAL_SCROLL',
          isAtBottom: isActuallyAtBottom,
          isScrollable,
        });
      }
      onScroll?.(e);
    },
    [onScroll, isScrollable, requireScroll],
  );

  const handleScrollToBottom = useCallback(() => {
    // Prevent multiple clicks
    if (isProgrammaticScrollRef.current) {
      return;
    }
    isProgrammaticScrollRef.current = true;
    scrollToBottom();
  }, [scrollToBottom]);

  const promptLegacyProps = useMemo(
    () =>
      isPrompt && {
        inputValue,
        onInputChange,
        placeholder,
      },
    [inputValue, onInputChange, placeholder, isPrompt],
  );

  const backgroundColor = useMemo(
    () =>
      contentBackgroundColor ??
      mapToExtensionCompatibleColor(content?.props?.backgroundColor) ??
      BackgroundColor.backgroundAlternative,
    [contentBackgroundColor, content?.props?.backgroundColor],
  );

  const sections = useMemo(
    () =>
      content &&
      mapToTemplate({
        map: {},
        element: content,
        onCancel,
        useFooter,
        promptLegacyProps,
        t,
        contentBackgroundColor: backgroundColor,
        componentMap: COMPONENT_MAPPING,
      }),
    [onCancel, useFooter, promptLegacyProps, t, backgroundColor, content],
  );

  // The renderer should only have a footer if there is a default cancel action
  // or if the footer component has been used.
  const hasFooter = useMemo(
    () => onCancel || content?.props?.children?.[1] !== undefined,
    [onCancel, content?.props?.children],
  );

  if (isLoading || !content) {
    return <LoadingSpinner />;
  }

  const { state: initialState, context } = interfaceState;

  return (
    <SnapInterfaceContextProvider
      snapId={snapId}
      interfaceId={interfaceId}
      initialState={initialState}
      context={context}
      requireScroll={requireScroll}
      showArrow={scrollState.showArrow}
      buttonsEnabled={buttonsEnabled}
      scrollToBottom={handleScrollToBottom}
    >
      <Box
        className="snap-ui-renderer__content"
        data-testid="snap-ui-renderer__content"
        ref={ref}
        onScroll={handleScroll}
        height={BlockSize.Full}
        backgroundColor={backgroundColor}
        style={{
          overflowY: 'auto',
          marginBottom: useFooter && hasFooter ? '80px' : '0',
        }}
      >
        <MetaMaskTemplateRenderer sections={sections} />
        {PERF_DEBUG && <PerformanceTracker />}
      </Box>
    </SnapInterfaceContextProvider>
  );
};

// SnapUIRenderer is memoized to avoid useless re-renders if one of the parents element re-renders.
export const SnapUIRenderer = memo(
  SnapUIRendererComponent,
  (prevProps, nextProps) => isEqual(prevProps, nextProps),
);

SnapUIRendererComponent.propTypes = {
  snapId: PropTypes.string,
  isLoading: PropTypes.bool,
  isPrompt: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  placeholder: PropTypes.string,
  interfaceId: PropTypes.string,
  useFooter: PropTypes.bool,
  onCancel: PropTypes.func,
  contentBackgroundColor: PropTypes.string,
  PERF_DEBUG: PropTypes.bool, // DO NOT USE THIS IN PRODUCTION
};
