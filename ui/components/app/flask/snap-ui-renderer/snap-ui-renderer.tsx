import React from 'react';
import { Json } from '@metamask/utils';
import { useSelector } from 'react-redux';
import nanoid from 'nanoid';
import {
  isComponent,
  Component,
  Panel,
  Heading,
  Text,
  NodeType,
} from '@metamask/snaps-ui';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';
import { getSnap } from '../../../../selectors';

export type SnapUIRendererProps = {
  snapId: string;
  data: Json;
};

// TODO: Types
const UI_MAPPING: Record<
  NodeType,
  (arg: Component) => Record<string, unknown>
> = {
  panel: (props: Panel) => ({
    element: 'Box',
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    children: props.children.map(mapToTemplate),
  }),
  heading: (props: Heading) => ({
    element: 'Typography',
    children: props.text,
    props: {
      variant: TYPOGRAPHY.H3,
      fontWeight: 'bold',
    },
  }),
  text: (props: Text) => ({
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

// TODO: Type
const mapToTemplate = (data: Component) => {
  const { type } = data;
  const mapped = UI_MAPPING[type](data);
  // TODO: We may want to have deterministic keys at some point
  return { ...mapped, key: nanoid() };
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({ snapId, data }: SnapUIRendererProps) => {
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
