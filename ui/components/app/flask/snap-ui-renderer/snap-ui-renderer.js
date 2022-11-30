import React from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import nanoid from 'nanoid';
import { isComponent } from '@metamask/snaps-ui';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { getSnap } from '../../../../selectors';

const UI_MAPPING = {
  panel: (props) => ({
    element: 'Box',
    // eslint-disable-next-line no-use-before-define
    children: props.children.map(mapToTemplate),
  }),
  heading: (props) => ({
    element: 'Typography',
    children: props.text,
    props: {
      variant: TYPOGRAPHY.H3,
      fontWeight: 'bold',
    },
  }),
  text: (props) => ({
    element: 'Typography',
    children: props.text,
    props: {
      variant: TYPOGRAPHY.H6,
    },
  }),
  spinner: () => ({
    element: 'Spinner',
    props: {
      className: 'snap-ui-renderer__spinner',
    },
  }),
  spacer: () => ({
    element: 'Box',
    props: {
      className: 'snap-ui-renderer__spacer',
    },
  }),
  divider: () => ({
    element: 'hr',
  }),
  // TODO
  copyable: () => ({
    element: 'hr',
  }),
};

const mapToTemplate = (data) => {
  const { type } = data;
  const mapped = UI_MAPPING[type](data);
  // TODO: We may want to have deterministic keys at some point
  return { ...mapped, key: nanoid() };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({ snapId, data }) => {
  const snap = useSelector((state) => getSnap(state, snapId));

  if (!snap) {
    return null;
  }

  if (!isComponent(data)) {
    // TODO: Should this throw?
    return null;
  }

  const sections = mapToTemplate(data);

  console.log(data, sections);

  return (
    <SnapDelineator snapName={snap.manifest.proposedName}>
      <MetaMaskTemplateRenderer sections={sections} />
    </SnapDelineator>
  );
};

SnapUIRenderer.propTypes = {
  snapId: PropTypes.string,
  data: PropTypes.object,
};
