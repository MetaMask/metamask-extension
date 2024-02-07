import { Text } from '@metamask/snaps-sdk';
import { UIComponent } from './types';

export const text: UIComponent<Text> = ({ element }) => ({
  element: 'SnapUIMarkdown',
  children: element.value,
  props: {
    markdown: element.markdown,
  },
});
