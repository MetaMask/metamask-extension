import { Panel } from '@metamask/snaps-sdk';
import {
  Display,
  FlexDirection,
  TextColor,
} from '../../../../../helpers/constants/design-system';
import { mapToTemplate } from '../utils';
import { UIComponentFactory } from './types';

export const panel: UIComponentFactory<Panel> = ({ element, root, ...params }) => ({
  element: 'Box',
  children: element.children.map((children) =>
    mapToTemplate({ ...params, element: children }),
  ),
  props: {
    display: Display.Flex,
    flexDirection: FlexDirection.Column,
    className: `snap-ui-renderer__panel ${
      root ? 'snap-ui-renderer__panel_root' : ''
    }`,
    color: TextColor.textDefault,
  },
});
