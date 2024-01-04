import React, { useState } from 'react';
import PropTypes from 'prop-types';
import {
  isComponent,
  ButtonTypes,
  UserInputEventTypes,
} from '@metamask/snaps-sdk';

import { useDispatch, useSelector } from 'react-redux';
import { debounce } from 'lodash';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import {
  TypographyVariant,
  OverflowWrap,
  FontWeight,
  TextVariant,
  BorderColor,
  TextColor,
  Display,
  FlexDirection,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box';
import { getSnapName } from '../../../../helpers/utils/util';
import {
  getInterfaceState,
  getTargetSubjectMetadata,
} from '../../../../selectors';
import { Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { DelineatorType } from '../../../../helpers/constants/snaps';
import {
  handleSnapRequest,
  updateInterfaceState,
} from '../../../../store/actions';

export const UI_MAPPING = {
  panel: ({ element, ...params }) => ({
    element: 'Box',
    children: element.children.map((children) =>
      // eslint-disable-next-line no-use-before-define
      mapToTemplate({ ...params, element: children }),
    ),
    props: {
      display: Display.Flex,
      flexDirection: FlexDirection.Column,
      className: 'snap-ui-renderer__panel',
      color: TextColor.textDefault,
    },
  }),
  heading: ({ element }) => ({
    element: 'Typography',
    children: element.value,
    props: {
      variant: TypographyVariant.H4,
      fontWeight: FontWeight.Bold,
      overflowWrap: OverflowWrap.Anywhere,
    },
  }),
  text: ({ element }) => ({
    element: 'SnapUIMarkdown',
    children: element.value,
    props: {
      markdown: element.markdown,
    },
  }),
  spinner: () => ({
    element: 'Spinner',
    props: {
      className: 'snap-ui-renderer__spinner',
    },
  }),
  divider: () => ({
    element: 'Box',
    props: {
      className: 'snap-ui-renderer__divider',
      backgroundColor: BorderColor.borderDefault,
      marginTop: 2,
      marginBottom: 2,
    },
  }),
  copyable: ({ element }) => ({
    element: 'Copyable',
    props: {
      text: element.value,
      sensitive: element.sensitive,
    },
  }),
  image: ({ element }) => ({
    element: 'SnapUIImage',
    props: {
      value: element.value,
    },
  }),
  row: ({ element, elementKey }) => ({
    element: 'ConfirmInfoRow',
    // eslint-disable-next-line no-use-before-define
    children: [mapToTemplate(element.value, elementKey)],
    props: {
      label: element.label,
      variant: element.variant,
      style: {
        // We do this to cause an overhang with certain confirmation row variants
        marginLeft: '-8px',
        marginRight: '-8px',
      },
    },
  }),
  address: ({ element }) => ({
    element: 'ConfirmInfoRowAddress',
    props: {
      address: element.value,
    },
  }),
  button: ({ element, form, state, handleEvent }) => ({
    element: 'DSButton',
    props: {
      className: 'snap-ui-renderer__button',
      marginBottom: 1,
      block: true,
      onClick: (event) => {
        event.preventDefault();
        handleEvent(
          element.buttonType === ButtonTypes.Submit
            ? {
                eventType: UserInputEventTypes.FormSubmitEvent,
                componentName: form,
                value: state[form],
              }
            : {
                eventType: UserInputEventTypes.ButtonClickEvent,
                componentName: element.name,
              },
        );
      },
      type: element.buttonType,
      variant: element.variant,
    },
    children: {
      element: 'SnapUIMarkdown',
      children: element.value,
    },
  }),
  form: ({ element, ...params }) => ({
    element: 'form',
    children: element.children.map((children) =>
      // eslint-disable-next-line no-use-before-define
      mapToTemplate({ ...params, element: children, form: element.name }),
    ),
    props: {
      className: 'snap-ui-renderer__form',
    },
  }),
  input: ({ element, state, form, handleEvent }) => ({
    element: 'FormTextField',
    props: {
      className: 'snap-ui-renderer__input',
      marginBottom: 1,
      value: form
        ? state?.[form]?.[element.name] ?? ''
        : state?.[element.name] ?? '',
      label: element.label,
      id: element.name,
      placeholder: element.placeholder,
      type: element.inputType,
      onChange: (event) =>
        handleEvent({
          eventType: 'stateChange',
          componentName: element.name,
          parentForm: form,
          value: event.target.value,
        }),
    },
  }),
};

// TODO: Stop exporting this when we remove the mapToTemplate hack in confirmation templates.
export const mapToTemplate = (params) => {
  const { type } = params.element;
  params.elementKeyIndex.value += 1;
  const indexKey = `snap_ui_element_${type}__${params.elementKeyIndex.value}`;
  const mapped = UI_MAPPING[type](params);
  return { ...mapped, key: indexKey };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({
  snapId,
  delineatorType = DelineatorType.Content,
  isCollapsable = false,
  isCollapsed = false,
  isLoading = false,
  data,
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

  const interfaceState = useSelector((state) =>
    getInterfaceState(state, interfaceId),
  );

  const [internalState, setInternalState] = useState(interfaceState);

  const handleEvent = ({ eventType, componentName, parentForm, value }) => {
    const snapRequestDebounced = debounce(
      () =>
        handleSnapRequest({
          snapId,
          origin: '',
          handler: 'onUserInput',
          request: {
            jsonrpc: '2.0',
            method: ' ',
            params: {
              event: value
                ? {
                    type: eventType,
                    name: componentName,
                    value,
                  }
                : { type: eventType, name: componentName },
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
    if (eventType !== 'stateChange') {
      snapRequestDebounced();
    }

    if (eventType === 'stateChange') {
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

    if (
      eventType === UserInputEventTypes.FormSubmitEvent ||
      eventType === UserInputEventTypes.ButtonClickEvent
    ) {
      snapRequestDebounced.flush();
      updateStateDebounced.flush();
    }
  };

  if (isLoading) {
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

  if (!isComponent(data)) {
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
    element: data,
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
  data: PropTypes.object,
  isCollapsable: PropTypes.bool,
  isCollapsed: PropTypes.bool,
  isLoading: PropTypes.bool,
  onClick: PropTypes.func,
  boxProps: PropTypes.object,
  interfaceId: PropTypes.string,
};
