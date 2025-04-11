import { address } from './address';
import { addressInput } from './address-input';
import { assetSelector } from './asset-selector';
import { avatar } from './avatar';
import { banner } from './banner';
import { bold } from './bold';
import { box } from './box';
import { image } from './image';
import { row } from './row';
import { copyable } from './copyable';
import { button } from './button';
import { fileInput } from './file-input';
import { form } from './form';
import { input } from './input';
import { italic } from './italic';
import { link } from './link';
import { field } from './field';
import { dropdown } from './dropdown';
import { radioGroup } from './radioGroup';
import { tooltip } from './tooltip';
import { value } from './value';
import { checkbox } from './checkbox';
import { card } from './card';
import { footer } from './footer';
import { container } from './container';
import { divider } from './divider';
import { heading } from './heading';
import { icon } from './icon';
import { section } from './section';
import { selector } from './selector';
import { skeleton } from './skeleton';
import { spinner } from './spinner';
import { text } from './text';

export const COMPONENT_MAPPING = {
  AssetSelector: assetSelector,
  Box: box,
  Heading: heading,
  Text: text,
  Divider: divider,
  Spinner: spinner,
  Icon: icon,
  Image: image,
  Copyable: copyable,
  Row: row,
  Address: address,
  AddressInput: addressInput,
  Avatar: avatar,
  Button: button,
  FileInput: fileInput,
  Form: form,
  Input: input,
  Bold: bold,
  Italic: italic,
  Link: link,
  Field: field,
  Dropdown: dropdown,
  RadioGroup: radioGroup,
  Value: value,
  Checkbox: checkbox,
  Tooltip: tooltip,
  Card: card,
  Footer: footer,
  Container: container,
  Selector: selector,
  Section: section,
  Banner: banner,
  Skeleton: skeleton,
};

export type COMPONENT_MAPPING = typeof COMPONENT_MAPPING;
