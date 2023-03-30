import React from 'react';
import PropTypes from 'prop-types';
import nanoid from 'nanoid';
import { isComponent } from '@metamask/snaps-ui';
import { useSelector } from 'react-redux';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import {
  TypographyVariant,
  FONT_WEIGHT,
  DISPLAY,
  FLEX_DIRECTION,
  OVERFLOW_WRAP,
  TextVariant,
} from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import Box from '../../../ui/box';
import { getSnapName } from '../../../../helpers/utils/util';
import { getTargetSubjectMetadata } from '../../../../selectors';
import { Text } from '../../../component-library';
import { Copyable } from '../copyable';
import { DelineatorType } from '../../../../helpers/constants/flask';

export const UI_MAPPING = {
  panel: (props) => ({
    element: 'Box',
    // eslint-disable-next-line no-use-before-define
    children: props.children.map(mapToTemplate),
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
      variant: TypographyVariant.H3,
      fontWeight: FONT_WEIGHT.BOLD,
      overflowWrap: OVERFLOW_WRAP.BREAK_WORD,
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
};

// TODO: Stop exporting this when we remove the mapToTemplate hack in confirmation templates.
export const mapToTemplate = (data) => {
  const { type } = data;
  const mapped = UI_MAPPING[type](data);
  // TODO: We may want to have deterministic keys at some point
  return { ...mapped, key: nanoid() };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({
  snapId,
  delineatorType = DelineatorType.content,
  data,
}) => {
  const t = useI18nContext();
  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, snapId),
  );

  const snapName = getSnapName(snapId, targetSubjectMetadata);

  if (!isComponent(data)) {
    return (
      <SnapDelineator snapName={snapName} type={DelineatorType.error}>
        <Text variant={TextVariant.bodySm} marginBottom={4}>
          {t('snapsUIError', [<b key="0">{snapName}</b>])}
        </Text>
        <Copyable text={t('snapsInvalidUIError')} />
      </SnapDelineator>
    );
  }

  const sections = mapToTemplate(data);

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
