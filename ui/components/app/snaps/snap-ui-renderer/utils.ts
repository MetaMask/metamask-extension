import { Component } from '@metamask/snaps-sdk';
import { COMPONENT_MAPPING } from './components';

export type MapToTemplateParams = {
  element: Component;
  elementKeyIndex: number;
  form?: string;
};

export const mapToTemplate = (params: MapToTemplateParams) => {
  const { type } = params.element;
  params.elementKeyIndex += 1;
  const indexKey = `snap_ui_element_${type}__${params.elementKeyIndex}`;
  // @ts-expect-error This is a problem with the types generated in the snaps repo.
  const mapped = COMPONENT_MAPPING[type](params as any);
  return { ...mapped, key: indexKey };
};
