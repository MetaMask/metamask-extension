import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { isEqual } from 'lodash';
import { getJsxChildren } from '@metamask/snaps-utils';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { SnapDelineator } from '../snap-delineator';
import { getSnapMetadata, getMemoizedInterface } from '../../../../selectors';
import { Box, FormTextField } from '../../../component-library';
import { DelineatorType } from '../../../../helpers/constants/snaps';

import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import PulseLoader from '../../../ui/pulse-loader';
import {
  AlignItems,
  BlockSize,
  Display,
  JustifyContent,
} from '../../../../helpers/constants/design-system';
import { happenDefaultButtons, mapToTemplate } from './utils';

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
  header,
}) => {
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const interfaceState = useSelector(
    (state) => getMemoizedInterface(state, interfaceId),
    // We only want to update the state if the content has changed.
    // We do this to avoid useless re-renders.
    (oldState, newState) => isEqual(oldState.content, newState.content),
  );

  const interfaceContent = interfaceState?.content;

  const content = useMemo(
    () =>
      interfaceContent.type === 'Container'
        ? getJsxChildren(interfaceContent)[0]
        : interfaceContent,
    [interfaceContent],
  );

  const footer = useMemo(
    () =>
      interfaceContent.type === 'Container' &&
      getJsxChildren(interfaceContent)[1],
    [interfaceContent],
  );

  // sections are memoized to avoid useless re-renders if one of the parents element re-renders.
  const contentSections = useMemo(
    () =>
      content &&
      mapToTemplate({
        map: {},
        element: content,
      }),
    [content],
  );

  const footerSections = useMemo(
    () =>
      footer &&
      mapToTemplate({
        map: {},
        element: footer,
      }),
    [footer],
  );

  const defaultFooterButtons = happenDefaultButtons(footer, onCancel);

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

  const { state: initialState, context } = interfaceState;

  return useDelineator ? (
    <SnapDelineator
      snapName={snapName}
      type={delineatorType}
      isCollapsable={isCollapsable}
      isCollapsed={isCollapsed}
      onClick={onClick}
      boxProps={boxProps}
    >
      <Box className="snap-ui-renderer__content">
        <SnapInterfaceContextProvider
          snapId={snapId}
          interfaceId={interfaceId}
          initialState={initialState}
          context={context}
        >
          <MetaMaskTemplateRenderer sections={contentSections} />
        </SnapInterfaceContextProvider>
        {isPrompt && (
          <FormTextField
            marginTop={4}
            className="snap-prompt-input"
            maxLength={300}
            value={inputValue}
            onChange={onInputChange}
            placeholder={placeholder}
          />
        )}
      </Box>
    </SnapDelineator>
  ) : (
    <Box className="snap-ui-renderer">
      {header}
      <SnapInterfaceContextProvider
        snapId={snapId}
        interfaceId={interfaceId}
        initialState={initialState}
        context={context}
      >
        <Box className="snap-ui-renderer__content">
          <MetaMaskTemplateRenderer sections={contentSections} />
          {isPrompt && (
            <FormTextField
              marginTop={4}
              className="snap-prompt-input"
              maxLength={300}
              value={inputValue}
              onChange={onInputChange}
              placeholder={placeholder}
            />
          )}
        </Box>
        {useFooter && (
          <Box className="snap-ui-renderer__footer">
            {defaultFooterButtons}
            <MetaMaskTemplateRenderer sections={footerSections} />
          </Box>
        )}
      </SnapInterfaceContextProvider>
    </Box>
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
  header: PropTypes.element,
};
