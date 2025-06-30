import { BannerElement, JSXElement } from '@metamask/snaps-sdk/jsx';
import { getJsxChildren } from '@metamask/snaps-utils';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const banner: UIComponentFactory<BannerElement> = ({
  element,
  ...params
}) => {
  return {
    element: 'SnapUIBanner',
    children: getJsxChildren(element).map((children) =>
      mapToTemplate({ element: children as JSXElement, ...params }),
    ),
    props: {
      title: element.props.title,
      severity: element.props.severity,
    },
  };
};
