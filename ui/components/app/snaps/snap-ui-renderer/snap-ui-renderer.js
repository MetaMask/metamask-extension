import React, { memo, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Container } from '@metamask/snaps-sdk/jsx';

import { isEqual } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { SnapDelineator } from '../snap-delineator';
import { getSnapMetadata, getMemoizedInterface } from '../../../../selectors';
import { Box, IconName } from '../../../component-library';
import { DelineatorType } from '../../../../helpers/constants/snaps';

import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import PulseLoader from '../../../ui/pulse-loader';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  Display,
  IconColor,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useScrollRequired } from '../../../../hooks/useScrollRequired';
import { useScrollHandling } from '../../../../hooks/useScrollHandling';
import { mapToExtensionCompatibleColor, mapToTemplate } from './utils';

/**
 * This hook is used to process the content of the Snap UI Renderer.
 * It adds the scroll arrow and the footer to the content if required.
 *
 * @param {object} rawContent - The raw content of the Snap UI Renderer.
 * @param {object} scrollState - The state of the scroll handling.
 * @param {object} scrollArrow - The scroll arrow component.
 * @param {boolean} requireScroll - Whether the content requires scrolling.
 * @returns The processed content.
 */
const useProcessedContent = (
  rawContent,
  scrollState,
  scrollArrow,
  requireScroll,
) => {
  return useMemo(() => {
    const baseContent =
      rawContent?.type === 'Container' || !rawContent
        ? rawContent
        : Container({ children: rawContent });

    if (requireScroll) {
      const children = [...baseContent.props.children];
      const footer = {
        ...children[children.length - 1],
        props: {
          ...children[children.length - 1].props,
          isScrolledToBottom: scrollState.buttonsEnabled,
          requireScroll: true,
        },
      };

      children[children.length - 1] = footer;

      if (scrollState.showArrow) {
        children.splice(-1, 0, scrollArrow);
      }

      return {
        ...baseContent,
        props: {
          ...baseContent.props,
          children,
        },
      };
    }

    return baseContent;
  }, [rawContent, scrollState, scrollArrow, requireScroll]);
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

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
const SnapUIRendererComponent = ({
  snapId,
  delineatorType = DelineatorType.Content,
  isCollapsable = false,
  isCollapsed = false,
  isLoading = false,
  // This is a workaround while we have the prompt dialog type since we can't inject the SnapUIRenderer in the template renderer.
  isPrompt = false,
  inputValue,
  onInputChange,
  placeholder,
  onClick,
  boxProps,
  interfaceId,
  useDelineator = true,
  useFooter = false,
  onCancel,
  contentBackgroundColor,
}) => {
  const t = useI18nContext();

  const interfaceState = useSelector(
    (state) => getMemoizedInterface(state, interfaceId),
    // We only want to update the state if the content has changed.
    // We do this to avoid useless re-renders.
    (oldState, newState) => isEqual(oldState.content, newState.content),
  );

  const requireScroll =
    interfaceState?.content?.props?.children?.[1]?.props?.requireScroll;

  const { isScrollable, scrollToBottom, onScroll, ref } = useScrollRequired(
    [],
    // Only enable hook if the content requires scrolling
    { enabled: requireScroll },
  );

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const { scrollState, handleScroll, handleScrollToBottom } = useScrollHandling(
    requireScroll,
    isScrollable,
  );

  const wrappedOnScroll = useCallback(
    (e) => {
      handleScroll(e, onScroll);
    },
    [handleScroll, onScroll],
  );

  const handleScrollToBottomClick = useCallback(() => {
    handleScrollToBottom(scrollToBottom);
  }, [handleScrollToBottom, scrollToBottom]);

  const scrollArrow = useMemo(() => {
    if (!requireScroll || !scrollState.showArrow) {
      return null;
    }

    return {
      type: 'AvatarIcon',
      key: 'snap-ui-renderer__scroll-arrow',
      props: {
        iconName: IconName.Arrow2Down,
        backgroundColor: BackgroundColor.infoDefault,
        color: IconColor.primaryInverse,
        className: 'snap-ui-renderer__scroll-button',
        onClick: handleScrollToBottomClick,
        style: {
          cursor: 'pointer',
          position: 'absolute',
          left: 0,
          right: 0,
          marginLeft: 'auto',
          marginRight: 'auto',
          zIndex: 'auto',
          bottom: '84px',
        },
      },
    };
  }, [handleScrollToBottomClick, requireScroll, scrollState.showArrow]);

  const processedContent = useProcessedContent(
    interfaceState?.content,
    scrollState,
    scrollArrow,
    requireScroll,
  );

  const promptLegacyProps = useMemo(
    () =>
      isPrompt && {
        inputValue,
        onInputChange,
        placeholder,
      },
    [inputValue, onInputChange, placeholder, isPrompt],
  );

  const backgroundColor =
    contentBackgroundColor ??
    mapToExtensionCompatibleColor(processedContent?.props?.backgroundColor) ??
    BackgroundColor.backgroundAlternative;

  // The renderer should only have a footer if there is a default cancel action
  // or if the footer component has been used.
  const hasFooter =
    onCancel || processedContent?.props?.children?.[1] !== undefined;

  const sections = useMemo(
    () =>
      processedContent &&
      mapToTemplate({
        map: {},
        element: processedContent,
        onCancel,
        useFooter,
        promptLegacyProps,
        t,
        contentBackgroundColor: backgroundColor,
        // We have to pass the props at the top level to ensure the children components get the correct props.
        requireScroll,
        isScrolledToBottom: scrollState.buttonsEnabled,
      }),
    [
      processedContent,
      onCancel,
      useFooter,
      promptLegacyProps,
      t,
      backgroundColor,
      scrollState.buttonsEnabled,
      requireScroll,
    ],
  );

  if (isLoading || !processedContent) {
    return <LoadingSpinner />;
  }

  const { state: initialState, context } = interfaceState;

  return useDelineator ? (
    <SnapDelineator
      snapName={snapName}
      type={delineatorType}
      isCollapsable={isCollapsable}
      isCollapsed={isCollapsed}
      onClick={onClick}
      boxProps={boxProps}
      disablePadding
    >
      <Box className="snap-ui-renderer__content">
        <SnapInterfaceContextProvider
          snapId={snapId}
          interfaceId={interfaceId}
          initialState={initialState}
          context={context}
        >
          <MetaMaskTemplateRenderer sections={sections} />
        </SnapInterfaceContextProvider>
      </Box>
    </SnapDelineator>
  ) : (
    <SnapInterfaceContextProvider
      snapId={snapId}
      interfaceId={interfaceId}
      initialState={initialState}
      context={context}
    >
      <Box
        className="snap-ui-renderer__content"
        ref={ref}
        onScroll={wrappedOnScroll}
        height={BlockSize.Full}
        backgroundColor={backgroundColor}
        style={{
          overflowY: 'auto',
          marginBottom: useFooter && hasFooter ? '80px' : '0',
        }}
      >
        <MetaMaskTemplateRenderer sections={sections} />
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
  delineatorType: PropTypes.string,
  isCollapsable: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isLoading: PropTypes.bool,
  isPrompt: PropTypes.bool,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  placeholder: PropTypes.string,
  onClick: PropTypes.func,
  boxProps: PropTypes.object,
  interfaceId: PropTypes.string,
  useDelineator: PropTypes.bool,
  useFooter: PropTypes.bool,
  onCancel: PropTypes.func,
  contentBackgroundColor: PropTypes.string,
};
