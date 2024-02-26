import { Component } from '@metamask/snaps-sdk';
import { COMPONENT_MAPPING } from './components';

export type MapToTemplateParams = {
  element: Component;
  elementKeyIndex: { value: number };
  rootKey: string;
  form?: string;
};

export const mapToTemplate = (params: MapToTemplateParams) => {
  const { type } = params.element;
  params.elementKeyIndex.value += 1;
  const indexKey = `${params.rootKey}_snap_ui_element_${type}__${params.elementKeyIndex.value}`;
  const mapped = COMPONENT_MAPPING[type](params as any);
  return { ...mapped, key: indexKey };
};
