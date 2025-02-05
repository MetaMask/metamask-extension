import React, { memo, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Container } from '@metamask/snaps-sdk/jsx';

import { isEqual } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { SnapDelineator } from '../snap-delineator';
import { getSnapMetadata, getMemoizedInterface } from '../../../../selectors';
import { Box } from '../../../component-library';
import { DelineatorType } from '../../../../helpers/constants/snaps';

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
import { useScrollHandling } from '../../../../hooks/useScrollHandling';
import { mapToExtensionCompatibleColor, mapToTemplate } from './utils';

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

  const scrollData = useScrollRequired([], { enabled: requireScroll });
  const { scrollState, handleScroll, handleScrollToBottom } = useScrollHandling(
    requireScroll,
    scrollData.isScrollable,
  );

  const buttonsEnabled = requireScroll ? scrollState.buttonsEnabled : true;

  const onScroll = useCallback(
    (e) => {
      handleScroll(e, scrollData.onScroll);
    },
    [handleScroll, scrollData.onScroll],
  );

  const scrollToBottom = useCallback(() => {
    handleScrollToBottom(scrollData.scrollToBottom);
  }, [handleScrollToBottom, scrollData.scrollToBottom]);

  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const rawContent = interfaceState?.content;

  const content =
    rawContent?.type === 'Container' || !rawContent
      ? rawContent
      : Container({ children: rawContent });

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
    mapToExtensionCompatibleColor(content?.props?.backgroundColor) ??
    BackgroundColor.backgroundAlternative;

  // The renderer should only have a footer if there is a default cancel action
  // or if the footer component has been used.
  const hasFooter = onCancel || content?.props?.children?.[1] !== undefined;

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
      }),
    [onCancel, useFooter, promptLegacyProps, t, backgroundColor, content],
  );

  if (isLoading || !content) {
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
      requireScroll={requireScroll}
      showArrow={scrollState.showArrow}
      buttonsEnabled={buttonsEnabled}
      scrollToBottom={scrollToBottom}
    >
      <Box
        className="snap-ui-renderer__content"
        ref={scrollData.ref}
        onScroll={onScroll}
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
