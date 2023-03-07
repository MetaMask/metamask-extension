/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Icon, ICON_NAMES } from '..';
import { HeaderBase } from './header-base';

describe('HeaderBase', () => {
  it('should render bannerbase element correctly', () => {
    const { getByTestId, container } = render(
      <HeaderBase data-testid="header-base" title="Bannerbase test">
        should render bannerbase element correctly
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
        title="Bannerbase test"
      >
        should render bannerbase element correctly
      </HeaderBase>,
    );
    expect(getByTestId('header-base')).toHaveClass('mm-header-base--test');
  });

  it('should render bannerbase title', () => {
    const { getByText } = render(<HeaderBase title="Bannerbase title test" />);
    expect(getByText('Bannerbase title test')).toHaveClass(
      'mm-header-base__title',
    );
  });

  it('should render bannerbase description', () => {
    const { getByText } = render(
      <HeaderBase description="Bannerbase description test" />,
    );
    expect(getByText('Bannerbase description test')).toBeDefined();
  });

  it('should render bannerbase children', () => {
    const { getByText } = render(
      <HeaderBase>Bannerbase children test</HeaderBase>,
    );
    expect(getByText('Bannerbase children test')).toBeDefined();
  });

  it('should render bannerbase action button', () => {
    const { getByTestId } = render(
      <HeaderBase
        title="Action prop demo"
        actionButtonLabel="Action"
        actionButtonProps={{
          endIconName: ICON_NAMES.ARROW_2_RIGHT,
          'data-testid': 'action',
          className: 'mm-header-base__action',
        }}
        actionButtonOnClick={() =>
          console.log('ButtonLink actionButtonOnClick demo')
        }
      >
        Use actionButtonLabel for action text, actionButtonOnClick for the
        onClick handler, and actionButtonProps to pass any ButtonLink prop types
        such as iconName
      </HeaderBase>,
    );
    expect(getByTestId('action')).toHaveClass('mm-header-base__action');
  });

  it('should render bannerbase startAccessory', () => {
    const { getByTestId } = render(
      <HeaderBase
        startAccessory={
          <Icon data-testid="start-accessory" name={ICON_NAMES.ADD_SQUARE} />
        }
      />,
    );

    expect(getByTestId('start-accessory')).toBeDefined();
  });

  it('should render and fire onClose event', async () => {
    const onClose = jest.fn();
    const { user, getByTestId } = renderWithUserEvent(
      <HeaderBase
        title="onClose Test"
        closeButtonProps={{ 'data-testid': 'close-button' }}
        onClose={onClose}
      />,
    );
    await user.click(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
