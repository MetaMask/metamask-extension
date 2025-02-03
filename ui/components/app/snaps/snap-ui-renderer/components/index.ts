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
import { fileInput } from './file-input';
import { form } from './form';
import { input } from './input';
import { bold } from './bold';
import { italic } from './italic';
import { link } from './link';
import { field } from './field';
import { dropdown } from './dropdown';
import { radioGroup } from './radioGroup';
import { value } from './value';
import { checkbox } from './checkbox';
import { tooltip } from './tooltip';
import { card } from './card';
import { footer } from './footer';
import { container } from './container';
import { selector } from './selector';
import { icon } from './icon';
import { section } from './section';
import { avatar } from './avatar';
import { banner } from './banner';
import { skeleton } from './skeleton';

export const COMPONENT_MAPPING = {
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
