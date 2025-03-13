import React from 'react';

import { ConfirmContextProvider } from '../../../context/confirm';
import ScrollToBottom from './scroll-to-bottom';

const Story = {
  title: 'Components/App/Confirm/ScrollToBottom',
  component: ScrollToBottom,
  decorators: [
    (story: any) => (
      <div style={{ height: '120px', width: '280px' }}>
        <ConfirmContextProvider>{story()}</ConfirmContextProvider>
      </div>
    ),
  ],

  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec vel suscipit tortor. Curabitur vulputate felis nibh, vel ' +
      'pellentesque erat fermentum eget. Duis id turpis cursus, blandit magna sit amet, tempor sem. Orci varius natoque ' +
      'penatibus et magnis dis parturient montes, nascetur ridiculus mus. Maecenas ex nulla, suscipit id eros in, elementum ' +
      'lacinia leo. Etiam dignissim neque vitae nibh pretium, sed egestas est mollis. Nam venenatis tellus sed tempor bibendum. ' +
      'Phasellus sodales quam nec enim imperdiet, non dignissim ipsum maximus. Suspendisse tempor vestibulum nisl, vel congue est ' +
      'semper ac. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Praesent mattis lorem lectus, ' +
      'sit amet suscipit elit egestas nec. Nam rhoncus eleifend velit, sed rhoncus enim porttitor at. Nam eget leo ut purus pulvinar sodales. ' +
      'Nullam ornare euismod dignissim. Duis blandit commodo viverra.',
  },
  argTypes: {
    children: { control: 'text' },
  },
};

export const DefaultStory = (args) => {
  return (
    <ScrollToBottom {...args}>
      <div style={{ minHeight: '420px' }}>{args.children}</div>
    </ScrollToBottom>
  );
};

DefaultStory.storyName = 'Default';

export default Story;
