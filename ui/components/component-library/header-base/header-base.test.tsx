/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { Icon, IconName } from '..';
import { HeaderBase } from './header-base';

describe('HeaderBase', () => {
  it('should render HeaderBase element correctly', () => {
    const { getByTestId, container } = render(
      <HeaderBase data-testid="header-base" title="HeaderBase test">
        should render HeaderBase element correctly
      </HeaderBase>,
    );
    expect(getByTestId('header-base')).toHaveClass('mm-header-base');
    expect(container).toMatchSnapshot();
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <HeaderBase
        className="mm-header-base--test"
        data-testid="header-base"
        title="HeaderBase test"
      >
        should render HeaderBase element correctly
      </HeaderBase>,
    );
    expect(getByTestId('header-base')).toHaveClass('mm-header-base--test');
  });

  it('should render HeaderBase children', () => {
    const { getByText } = render(
      <HeaderBase>HeaderBase children test</HeaderBase>,
    );
    expect(getByText('HeaderBase children test')).toBeDefined();
  });

  it('should render HeaderBase startAccessory', () => {
    const { getByTestId } = render(
      <HeaderBase
        startAccessory={
          <Icon data-testid="start-accessory" name={IconName.AddSquare} />
        }
      />,
    );

    expect(getByTestId('start-accessory')).toBeDefined();
  });

  it('should render HeaderBase endAccessory', () => {
    const { getByTestId } = render(
      <HeaderBase
        endAccessory={
          <Icon data-testid="end-accessory" name={IconName.AddSquare} />
        }
      />,
    );

    expect(getByTestId('end-accessory')).toBeDefined();
  });
});
