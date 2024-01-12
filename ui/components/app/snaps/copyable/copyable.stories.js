import React from 'react';
import { Copyable } from './copyable';

export default {
  title: 'Components/App/Snaps/Copyable',
  component: Copyable,
  argTypes: {
    text: {
      control: 'text',
    },
    sensitive: {
      control: 'boolean',
    },
  },
};

export const DefaultStory = (args) => <Copyable {...args} />;
DefaultStory.storyName = 'Default';

DefaultStory.args = {
  text: 'Content to copy',
};

export const SensitiveStory = (args) => <Copyable {...args} />;
SensitiveStory.storyName = 'Sensitive';
SensitiveStory.args = {
  text: 'Sensitive informations',
  sensitive: true,
};

export const ShowMoreStory = (args) => <Copyable {...args} />;
ShowMoreStory.storyName = 'Show More';
ShowMoreStory.args = {
  text: `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean ultrices arcu quis lorem luctus, consequat vulputate leo viverra. Phasellus vulputate nulla libero, vel mollis justo dapibus sed. Donec suscipit nisl et posuere mollis. Integer varius magna id fringilla finibus. Duis porttitor nisi ante, id viverra nibh aliquam vel. Aliquam in malesuada urna, ac dictum sem. Cras dictum sagittis turpis, sed molestie justo ornare feugiat. Morbi laoreet pulvinar arcu, id maximus sapien tempor eget. Nulla gravida elementum rutrum. Sed at dui efficitur, commodo ipsum sit amet, tempor elit. Donec sagittis mi at libero mollis elementum. Cras et justo at orci porttitor mollis. Nullam ac sapien a ex varius hendrerit iaculis ac leo. Curabitur ut dui finibus, faucibus nisl eu, pharetra quam. Mauris vulputate sapien quis malesuada commodo. Pellentesque ullamcorper pellentesque leo eu dictum. Nam accumsan tincidunt dolor, sit amet fringilla orci aliquet at. Etiam eget lorem nunc. Fusce nec lacus sed risus vestibulum congue. Integer massa ante, mattis in finibus dictum, luctus non lectus. Ut scelerisque aliquet felis, id lacinia lacus dictum eget. Sed consequat est nec sem maximus facilisis. Nam sit amet cursus augue. Quisque elit ipsum, cursus et ipsum quis, euismod ornare arcu. Quisque consectetur est purus, laoreet mattis mauris malesuada non. Vestibulum congue nibh nec sollicitudin mollis. In gravida quam quam, ut mollis ante sodales a. Morbi auctor dui ut mauris aliquet consequat. Morbi elementum semper dui, pulvinar dapibus ipsum gravida ac. Vivamus fringilla tortor libero, iaculis tincidunt sapien iaculis vitae. Duis sollicitudin tempor massa, quis commodo nisl ultricies nec. Pellentesque vitae enim felis. Sed ac felis nec odio viverra eleifend ut et velit. Sed volutpat, massa a porttitor efficitur, erat eros tincidunt dolor, eu feugiat nisi velit ac orci. In fermentum aliquet blandit. Praesent et ligula at justo tristique placerat. In et ligula magna. Proin vel condimentum eros, sit amet gravida erat. Fusce in augue sed metus imperdiet posuere in in ex. Nunc tempor, leo et mollis pharetra, sapien orci euismod diam, sit amet dictum erat magna vitae sapien. Duis egestas tortor non turpis tincidunt gravida vitae a ipsum. Vivamus in sapien sed diam aliquet tincidunt. Suspendisse potenti. Curabitur scelerisque euismod neque a vestibulum. Phasellus dolor ante, aliquet ullamcorper dui non, laoreet interdum lectus. Sed nec suscipit orci, vitae aliquet ligula. Cras ex velit, mollis in sollicitudin at, ornare non quam. Nunc ultricies nibh vitae ultricies semper. Vivamus eget diam vestibulum, maximus est sed, condimentum elit. Vivamus efficitur cursus nibh eget tempus. Donec sagittis maximus rhoncus. Vivamus fermentum magna id molestie congue. Fusce quam augue, egestas id molestie sed, finibus eu arcu. In et nunc porttitor, scelerisque turpis sit amet, interdum lectus. Suspendisse eu metus magna. Vestibulum lorem felis, aliquam quis porta vel, dictum non lectus. Vivamus consectetur nec quam vitae.`,
};
