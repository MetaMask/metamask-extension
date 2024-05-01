import { box } from './box';
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
import { bold } from './bold';
import { italic } from './italic';
import { link } from './link';
import { field } from './field';

export const COMPONENT_MAPPING = {
  Box: box,
  Heading: heading,
  Text: text,
  Divider: divider,
  Spinner: spinner,
  Image: image,
  Copyable: copyable,
  Row: row,
  Address: address,
  Button: button,
  Form: form,
  Input: input,
  Bold: bold,
  Italic: italic,
  Link: link,
  Field: field,
};
