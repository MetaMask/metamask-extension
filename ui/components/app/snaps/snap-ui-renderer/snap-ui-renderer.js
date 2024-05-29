import React, { memo, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';

import { isEqual } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { SnapDelineator } from '../snap-delineator';
import {
  getSnapMetadata,
  getMemoizedInterfaceContent,
} from '../../../../selectors';
import { Box, FormTextField } from '../../../component-library';
import { DelineatorType } from '../../../../helpers/constants/snaps';

import { SnapInterfaceContextProvider } from '../../../../contexts/snaps';
import { mapToTemplate } from './utils';

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
}) => {
  const { name: snapName } = useSelector((state) =>
    getSnapMetadata(state, snapId),
  );

  const content = useSelector((state) =>
    getMemoizedInterfaceContent(state, interfaceId),
  );

  // sections are memoized to avoid useless re-renders if one of the parents element re-renders.
  const sections = useMemo(
    () =>
      content &&
      mapToTemplate({
        map: {},
        element: content,
      }),
    [content],
  );

  if (isLoading || !content) {
    return (
      <SnapDelineator
        snapName={snapName}
        type={delineatorType}
        isCollapsable={isCollapsable}
        isCollapsed={isCollapsed}
        onClick={onClick}
        boxProps={boxProps}
        isLoading
      />
    );
  }

  return (
    <SnapDelineator
      snapName={snapName}
      type={delineatorType}
      isCollapsable={isCollapsable}
      isCollapsed={isCollapsed}
      onClick={onClick}
      boxProps={boxProps}
    >
      <Box className="snap-ui-renderer__content">
        <SnapInterfaceContextProvider snapId={snapId} interfaceId={interfaceId}>
          <MetaMaskTemplateRenderer sections={sections} />
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
};
