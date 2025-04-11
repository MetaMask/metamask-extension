import type { LinkElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import type { NonEmptyArray } from '@metamask/utils';

import { mapTextToTemplate } from '../utils';
import type { UIComponentFactory } from './types';

export const link: UIComponentFactory<LinkElement> = ({
  element,
  ...params
}) => ({
  element: 'SnapUILink',
  children: mapTextToTemplate(
    getJsxChildren(element) as NonEmptyArray<string | JSXElement>,
    params,
  ),
  props: {
    href: element.props.href,
  },
});
