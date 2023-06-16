import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { NodeType, isComponent } from '@metamask/snaps-ui';
import { useSelector } from 'react-redux';
import { UserInputEventType } from '@metamask/snaps-utils';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import {
  DISPLAY,
  FLEX_DIRECTION,
  TypographyVariant,
  OverflowWrap,
  FontWeight,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box';
import { getSnapName } from '../../../../helpers/utils/util';
import { getTargetSubjectMetadata } from '../../../../selectors';
import { Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import { handleSnapRequest } from '../../../../store/actions';

const handleEvent = async (interfaceId, event, snapId) => {
  console.log('snapId inside handleEvent: ', snapId);
  return await handleSnapRequest({
    snapId,
    origin: '',
    handler: 'onUserInput',
    request: {
      jsonrpc: '2.0',
      method: ' ',
      params: { event, id: interfaceId },
    },
  });
};

export const UI_MAPPING = {
  panel: (props, elementKey, interfaceId, snapId) => ({
    element: 'Box',
    children: props.children.map((element) =>
      // eslint-disable-next-line no-use-before-define
      mapToTemplate(element, elementKey, interfaceId, snapId),
    ),
    props: {
      display: DISPLAY.FLEX,
      flexDirection: FLEX_DIRECTION.COLUMN,
      className: 'snap-ui-renderer__panel',
    },
  }),
  heading: (props) => ({
    element: 'Typography',
    children: props.value,
    props: {
      variant: TypographyVariant.H4,
      fontWeight: FontWeight.Bold,
      overflowWrap: OverflowWrap.BreakWord,
    },
  }),
  text: (props) => ({
    element: 'SnapUIMarkdown',
    children: props.value,
  }),
  spinner: () => ({
    element: 'Spinner',
    props: {
      className: 'snap-ui-renderer__spinner',
    },
  }),
  divider: () => ({
    element: 'hr',
    props: {
      className: 'snap-ui-renderer__divider',
    },
  }),
  copyable: (props) => ({
    element: 'Copyable',
    props: {
      text: props.value,
    },
  }),
  button: (props, _elementKey, interfaceId, snapId) => ({
    element: 'Button',
    props: {
      onClick: () =>
        handleEvent(
          interfaceId,
          { type: UserInputEventType.ButtonClickEvent, name: props.name },
          snapId,
        ),
      type: props.variant,
    },
    children: {
      element: 'SnapUIMarkdown',
      children: props.value,
    },
  }),
};

const statefullComponents = [NodeType.Form, NodeType.Input];

const isForm = (type) => type === NodeType.Form;
const isStatefullComponent = (type) => statefullComponents.includes(type);

// TODO: Stop exporting this when we remove the mapToTemplate hack in confirmation templates.
export const mapToTemplate = (data, elementKeyIndex, interfaceId, snapId) => {
  const { type } = data;
  elementKeyIndex.value += 1;
  const indexKey = `snap_ui_element_${type}__${elementKeyIndex.value}`;
  console.log(data.value);
  const mapped = UI_MAPPING[type](data, elementKeyIndex, interfaceId, snapId);
  return { ...mapped, key: indexKey };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({
  snapId,
  delineatorType = DelineatorType.Content,
  data,
}) => {
  const [state, setState] = useState({});
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);

  if (!isComponent(data)) {
    return (
      <SnapDelineator snapName={snapName} type={DelineatorType.Error}>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          {t('snapsUIError', [<b key="0">{snapName}</b>])}
        </Text>
        <Copyable text={t('snapsInvalidUIError')} />
      </SnapDelineator>
    );
  }

  const elementKeyIndex = { value: 0 };
  const sections = mapToTemplate(data, elementKeyIndex, snapId);

  return (
    <SnapDelineator snapName={snapName} type={delineatorType}>
      <Box className="snap-ui-renderer__content">
        <MetaMaskTemplateRenderer sections={sections} />
      </Box>
    </SnapDelineator>
  );
};

SnapUIRenderer.propTypes = {
  snapId: PropTypes.string,
  delineatorType: PropTypes.string,
  data: PropTypes.object,
};
