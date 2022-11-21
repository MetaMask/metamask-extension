import React from 'react';
import { Json } from '@metamask/utils';
import MetaMaskTemplateRenderer from '../../metamask-template-renderer/metamask-template-renderer';
import { TYPOGRAPHY } from '../../../../helpers/constants/design-system';
import { SnapDelineator } from '../snap-delineator';

export type SnapUIRendererProps = {
  data: Json;
};

// TODO: Types
// TODO: Handle keys
const UI_MAPPING = {
  // eslint-disable-next-line @typescript-eslint/no-use-before-define
  panel: (props) => ({
    element: 'Box',
    key: 'panel',
    children: props.children.map(mapToTemplate),
  }),
  heading: (props) => ({
    element: 'Typography',
    key: 'title',
    children: props.text,
    props: {
      variant: TYPOGRAPHY.H3,
      fontWeight: 'bold',
    },
  }),
  text: (props) => ({
    element: 'Typography',
    key: 'subtitle',
    children: props.text,
    props: {
      variant: TYPOGRAPHY.H6,
    },
  }),
  spinner: () => ({
    element: 'Spinner',
    key: 'spinner',
    props: {
      className: 'snap-ui-renderer__spinner',
    },
  }),
  spacer: () => ({
    element: 'Box',
    key: 'spacer',
    props: {
      className: 'snap-ui-renderer__spacer',
    },
  }),
  divider: () => ({
    element: 'hr',
    key: 'divider',
  }),
};

// TODO: Type
const mapToTemplate = (data: Json) => {
  const { type } = data;
  const mapped = UI_MAPPING[type](data);
  return mapped;
};

// Component that maps Snaps UI JSON format to MetaMask Template Renderer format
export const SnapUIRenderer = ({ data }: SnapUIRendererProps) => {
  // TODO: Validate

  const sections = mapToTemplate(data);

  console.log(data, sections);

  return (
    <SnapDelineator snapId="foo">
      <MetaMaskTemplateRenderer sections={sections} />
    </SnapDelineator>
  );
};
