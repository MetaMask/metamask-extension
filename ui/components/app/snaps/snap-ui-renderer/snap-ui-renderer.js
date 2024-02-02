import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { isComponent } from '@metamask/snaps-sdk';

import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { TextVariant } from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { useI18nContext } from '../../../../hooks/useI18nContext';

import { getSnapName } from '../../../../helpers/utils/util';
import { getInterface, getTargetSubjectMetadata } from '../../../../selectors';
import { Box, Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import {
  deleteInterface,
  handleSnapRequest,
  updateInterfaceState,
} from '../../../../store/actions';
import { COMPONENT_MAPPING } from './components';

// TODO: Stop exporting this when we remove the mapToTemplate hack in confirmation templates.
export const mapToTemplate = (params) => {
  const { type } = params.element;
  params.elementKeyIndex.value += 1;
  const indexKey = `snap_ui_element_${type}__${params.elementKeyIndex.value}`;
  const mapped = COMPONENT_MAPPING[type](params);
  return { ...mapped, key: indexKey };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({
  snapId,
  delineatorType = DelineatorType.Content,
  isCollapsable = false,
  isCollapsed = false,
  isLoading = false,
  onClick,
  boxProps,
  interfaceId,
}) => {
  const dispatch = useDispatch();
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);

  const interfaceData = useSelector((state) =>
    getInterface(state, interfaceId),
  );

  const [internalState, setInternalState] = useState(
    interfaceData?.interfaceState ?? {},
  );

  // We delete the interface on unmount because it means the UI has been unloaded.
  useEffect(() => {
    return () =>
      interfaceId && dispatch(dispatch(deleteInterface(interfaceId)));
  }, []);

  const snapRequestDebounced = debounce(
    (params) =>
      handleSnapRequest({
        snapId,
        origin: '',
        handler: 'onUserInput',
        request: {
          jsonrpc: '2.0',
          method: ' ',
          params: {
            event: params.value
              ? {
                  type: params.eventType,
                  name: params.componentName,
                  value: params.value,
                }
              : { type: params.eventType, name: params.componentName },
            id: interfaceId,
          },
        },
      }),
    200,
  );

  const updateStateDebounced = debounce(
    (state) => dispatch(updateInterfaceState(interfaceId, state)),
    200,
  );

  const handleEvent = ({ eventType, componentName, parentForm, value }) => {
    if (eventType) {
      updateStateDebounced.flush();

      snapRequestDebounced({ value, eventType, componentName });
    }

    if (!eventType) {
      const state = parentForm
        ? {
            ...internalState,
            [parentForm]: {
              ...internalState[parentForm],
              [componentName]: value,
            },
          }
        : { ...internalState, [componentName]: value };

      setInternalState(state);
      updateStateDebounced(state);
    }
  };

  if (isLoading || !interfaceData) {
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

  if (!isComponent(interfaceData.content)) {
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

  const elementKeyIndex = { value: 0 };
  const sections = mapToTemplate({
    element: interfaceData.content,
    elementKeyIndex,
    snapId,
    state: internalState,
    handleEvent,
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
        <MetaMaskTemplateRenderer sections={sections} />
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
  onClick: PropTypes.func,
  boxProps: PropTypes.object,
  interfaceId: PropTypes.string,
};
