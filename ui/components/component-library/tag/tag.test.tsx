/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { IconName } from '../icon';
import { IconColor } from '../../../helpers/constants/design-system';
import { Tag } from './tag';

describe('Tag', () => {
  it('should render the label inside the tag and match snapshot', () => {
    const { getByTestId, container } = render(
      <Tag data-testid="tag" label="Imported" />,
    );
    expect(getByTestId('tag')).toBeDefined();
    expect(getByTestId('tag')).toHaveTextContent('Imported');
    expect(container).toMatchSnapshot();
  });

  it('should render a tag with an icon and a label', () => {
    const { getByTestId, container } = render(
      <Tag
        data-testid="tag"
        label="Snap Name"
        startIconName={IconName.Snaps}
      />,
    );
    const tag = getByTestId('tag');
    expect(tag).toBeDefined();
    expect(tag).toHaveTextContent('Snap Name');
    const icon = tag.querySelector('svg');
    expect(icon).toBeDefined();
    expect(container).toMatchSnapshot();
  });

  it('should render a tag with an icon and a label and icon props', () => {
    const { getByTestId, container } = render(
      <Tag
        data-testid="tag"
        label="Snap Name"
        startIconName={IconName.Snaps}
        startIconProps={{
          color: IconColor.primaryDefault,
        }}
      />,
    );
    const tag = getByTestId('tag');
    expect(tag).toBeDefined();
    expect(tag).toHaveTextContent('Snap Name');
    const icon = tag.querySelector('.mm-icon');
    expect(icon).toBeDefined();
    expect(icon).toHaveClass('mm-box--color-primary-default');
    expect(container).toMatchSnapshot();
  });
});
