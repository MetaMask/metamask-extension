import React from 'react';
import classnames from 'classnames';

export default function Privacy({ as = 'div', children, className }) {
  const Component = as;

  return (
    <Component className={classnames('privacy', className)}>
      {children}
    </Component>
  );
}
