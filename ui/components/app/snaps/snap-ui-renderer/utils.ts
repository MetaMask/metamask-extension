import { Component } from '@metamask/snaps-sdk';
import { memoize } from 'lodash';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex, remove0x } from '@metamask/utils';
import { COMPONENT_MAPPING } from './components';

export type MapToTemplateParams = {
  map: Record<string, number>;
  element: Component;
  form?: string;
};

const generateHash = memoize((component: Component) => {
  const { type, name } = component;
  const value =
    typeof component.value === 'string'
      ? component.value.slice(0, 5000)
      : component.value;
  return remove0x(
    bytesToHex(
      sha256(
        JSON.stringify({
          type,
          name: name ?? null,
          value,
        }),
      ),
    ),
  );
});

function generateKey(map: Record<string, number>, component: Component) {
  const hash = generateHash(component);
  const count = (map[hash] ?? 0) + 1;
  map[hash] = count;
  return `${hash}_${count}`;
}

export const mapToTemplate = (params: MapToTemplateParams) => {
  const { type } = params.element;
  const indexKey = generateKey(params.map, params.element);
  // @ts-expect-error This seems to be compatibility issue between superstruct and this repo.
  const mapped = COMPONENT_MAPPING[type](params as any);
  return { ...mapped, key: indexKey };
};
