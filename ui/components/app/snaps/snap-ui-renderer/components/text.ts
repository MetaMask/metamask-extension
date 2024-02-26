import { Text } from '@metamask/snaps-sdk';
import { UIComponentFactory } from './types';

export const text: UIComponentFactory<Text> = ({ element }) => ({
  element: 'SnapUIMarkdown',
  children: element.value,
  props: {
    markdown: element.markdown,
  },
});
