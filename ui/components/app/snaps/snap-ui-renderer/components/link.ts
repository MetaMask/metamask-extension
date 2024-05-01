import { LinkElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapTextToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const link: UIComponentFactory<LinkElement> = ({
  element,
  ...params
}) => ({
  element: 'SnapUILink',
  children: mapTextToTemplate(getJsxChildren(element), params),
  props: {
    href: element.props.href,
  },
});
