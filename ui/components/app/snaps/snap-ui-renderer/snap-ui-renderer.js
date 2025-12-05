import React, { memo, useMemo, useRef } from 'react';
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
import { mapToExtensionCompatibleColor, mapToTemplate } from './utils';
import { COMPONENT_MAPPING } from './components';

// Component for tracking the number of re-renders
// DO NOT USE IN PRODUCTION
const PerformanceTracker = () => {
  const rendersRef = useRef(0);
  rendersRef.current += 1;

  return <span data-testid="performance" data-renders={rendersRef.current} />;
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
  // eslint-disable-next-line react-compiler/react-compiler
  'use no memo';

  const t = useI18nContext();

  const interfaceState = useSelector(
    (state) => getMemoizedInterface(state, interfaceId),
    // We only want to update the state if the content has changed.
    // We do this to avoid useless re-renders.
    (oldState, newState) => isEqual(oldState.content, newState.content),
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
    [content, onCancel, useFooter, promptLegacyProps, t, backgroundColor],
  );

  if (isLoading || !content) {
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
  }

  const { state: initialState } = interfaceState;

  return (
    <SnapInterfaceContextProvider
      snapId={snapId}
      interfaceId={interfaceId}
      initialState={initialState}
    >
      <Box
        className="snap-ui-renderer__content"
        height={BlockSize.Full}
        backgroundColor={backgroundColor}
        style={{
          overflowY: 'auto',
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
