import React from 'react';
import { text } from '@storybook/addon-knobs';
import { action } from '@storybook/addon-actions';
import Popover from './popover.component';

const containerStyle = {
  width: 800,
  height: 600,
  background: 'pink',
  position: 'relative',
};

const mainWrapperStyle = {
  padding: '0 24px 24px',
};

export default {
  title: 'Popover',
};

export const approve = () => (
  <div style={containerStyle}>
    <Popover
      title={text('title', 'Approve spend limit')}
      subtitle={text('subtitle', 'This is the new limit')}
      onClose={action('clicked')}
      footer={<button>Example Footer</button>}
    >
      <main style={mainWrapperStyle}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua. Semper
          eget duis at tellus at urna condimentum. Posuere urna nec tincidunt
          praesent semper. Arcu dictum varius duis at. A lacus vestibulum sed
          arcu. Orci porta non pulvinar neque laoreet suspendisse interdum.
          Pretium fusce id velit ut. Ut consequat semper viverra nam libero
          justo laoreet sit. In ante metus dictum at tempor commodo ullamcorper
          a lacus. Posuere morbi leo urna molestie at elementum eu facilisis
          sed. Libero enim sed faucibus turpis in eu mi bibendum neque. Amet
          massa vitae tortor condimentum lacinia quis. Pretium viverra
          suspendisse potenti nullam ac. Pellentesque elit eget gravida cum
          sociis natoque penatibus. Proin libero nunc consequat interdum varius
          sit amet. Est ultricies integer quis auctor elit sed vulputate. Ornare
          arcu odio ut sem nulla pharetra. Eget nullam non nisi est sit. Leo vel
          fringilla est ullamcorper eget nulla.
        </p>
        <p>
          Mattis pellentesque id nibh tortor id. Commodo sed egestas egestas
          fringilla phasellus. Semper eget duis at tellus at urna. Tristique
          nulla aliquet enim tortor at auctor urna nunc. Pellentesque habitant
          morbi tristique senectus et netus et. Turpis egestas sed tempus urna
          et pharetra pharetra massa massa. Mi eget mauris pharetra et ultrices
          neque ornare aenean. Facilisis volutpat est velit egestas dui id
          ornare arcu odio. Lacus sed turpis tincidunt id aliquet risus feugiat
          in. Cras tincidunt lobortis feugiat vivamus. Blandit libero volutpat
          sed cras ornare arcu. Facilisi morbi tempus iaculis urna id volutpat.
          Risus viverra adipiscing at in tellus. Leo vel orci porta non pulvinar
          neque. Malesuada fames ac turpis egestas integer. Euismod nisi porta
          lorem mollis aliquam.
        </p>
      </main>
    </Popover>
  </div>
);
