import { NodeType } from '@metamask/snaps-sdk';
import { panel } from './panel';
import { heading } from './heading';
import { text } from './text';
import { divider } from './divider';
import { spinner } from './spinner';
import { image } from './image';
import { row } from './row';
import { address } from './address';
import { copyable } from './copyable';
import { button } from './button';
import { form } from './form';
import { input } from './input';
import { UIComponentFactory } from './types';

export const COMPONENT_MAPPING: Record<NodeType, UIComponentFactory<any>> = {
  panel,
  heading,
  text,
  divider,
  spinner,
  image,
  copyable,
  row,
  address,
  button,
  form,
  input,
};
