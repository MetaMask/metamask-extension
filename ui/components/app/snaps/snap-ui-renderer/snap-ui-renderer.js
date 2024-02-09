import React from 'react';
import PropTypes from 'prop-types';
import { isComponent } from '@metamask/snaps-sdk';

import { useSelector } from 'react-redux';

import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { getSnapName } from '../../../../helpers/utils/util';
import {
  getMemoizedInterface,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import { Box, FormTextField, Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { DelineatorType } from '../../../../helpers/constants/snaps';

import { SnapInterfaceContextProvider } from '../../../../contexts/snap';
import { mapToTemplate } from './utils';

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({
  snapId,
  delineatorType = DelineatorType.Content,
  isCollapsable = false,
  isCollapsed = false,
  isLoading = false,
  isPrompt = false,
  // This is a workaround while we have the prompt dialog type since we can't inject the SnapUIRenderer in the template renderer.
  inputValue,
  onInputChange,
  placeholder,
  onClick,
  boxProps,
  interfaceId,
}) => {
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);

  const { content } = useSelector((state) =>
    getMemoizedInterface(state, interfaceId),
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
        isLoading={isLoading}
      />
    );
  }

  if (!isComponent(content)) {
    return (
      <SnapDelineator
        isCollapsable={isCollapsable}
        isCollapsed={isCollapsed}
        snapName={snapName}
        type={DelineatorType.Error}
        onClick={onClick}
        boxProps={boxProps}
      >
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          {t('snapsUIError', [<b key="0">{snapName}</b>])}
        </Text>
        <Copyable text={t('snapsInvalidUIError')} />
      </SnapDelineator>
    );
  }

  const elementKeyIndex = 0;
  const sections = mapToTemplate({
    element: content,
    elementKeyIndex,
  });

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

SnapUIRenderer.propTypes = {
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
