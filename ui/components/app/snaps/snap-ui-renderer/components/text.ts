import { Text } from '@metamask/snaps-sdk';
import { UiComponent } from './types';

export const text: UiComponent<Text> = ({ element }) => ({
  element: 'SnapUIMarkdown',
  children: element.value,
  props: {
    markdown: element.markdown,
  },
});
