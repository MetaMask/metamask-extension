import React from 'react';

import Breadcrumbs from './breadcrumbs.component';
import README from './README.mdx';

export default {
  title: 'Components/UI/Breadcrumbs ',

  component: Breadcrumbs,
  parameters: {
    docs: {
      page: README,
    },
  },
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
