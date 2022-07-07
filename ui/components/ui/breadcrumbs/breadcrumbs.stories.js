import React from 'react';
import Breadcrumbs from './breadcrumbs.component';

export default {
  title: 'Components/UI/Breadcrumbs ',
  id: __filename,
  component: Breadcrumbs,
  argsTypes: {
    currentIndex: {
      control: 'number',
    },
    total: {
      control: 'number',
    },
    className: { control: 'text' },
  },
};

export const DefaultBreadcrumbs = (args) => {
  return <Breadcrumbs {...args} />;
};

DefaultBreadcrumbs.storyName = 'Default';
DefaultBreadcrumbs.args = {
  currentIndex: 1,
  total: 3,
};
