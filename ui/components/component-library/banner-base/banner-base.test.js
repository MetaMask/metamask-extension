/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Icon, ICON_NAMES } from '..';
import { BannerBase } from './banner-base';

describe('BannerBase', () => {
  it('should render bannerbase element correctly', () => {
    const { getByTestId, container } = render(
      <BannerBase data-testid="banner-base" title="Bannerbase test">
        should render bannerbase element correctly
      </BannerBase>,
    );
    expect(getByTestId('banner-base')).toHaveClass('mm-banner-base');
    expect(container).toMatchSnapshot();
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <BannerBase
        className="mm-banner-base--test"
        data-testid="banner-base"
        title="Bannerbase test"
      >
        should render bannerbase element correctly
      </BannerBase>,
    );
    expect(getByTestId('banner-base')).toHaveClass('mm-banner-base--test');
  });

  it('should render bannerbase title', () => {
    const { getByText } = render(<BannerBase title="Bannerbase title test" />);
    expect(getByText('Bannerbase title test')).toHaveClass(
      'mm-banner-base__title',
    );
  });

  it('should render bannerbase description', () => {
    const { getByText } = render(
      <BannerBase>Bannerbase description test</BannerBase>,
    );
    expect(getByText('Bannerbase description test')).toBeDefined();
  });

  it('should render bannerbase action button', () => {
    const { getByTestId } = render(
      <BannerBase
        title="Action prop demo"
        actionButtonLabel="Action"
        actionButtonProps={{
          icon: ICON_NAMES.ARROW_2_RIGHT, // TODO: change to iconName
          iconPositionRight: true,
          'data-testid': 'action',
          className: 'mm-banner-base__action',
        }}
        actionButtonOnClick={() =>
          console.log('ButtonLink actionButtonOnClick demo')
        }
      >
        Use actionButtonLabel for action text, actionButtonOnClick for the
        onClick handler, and actionButtonProps to pass any ButtonLink prop types
        such as iconName
      </BannerBase>,
    );
    expect(getByTestId('action')).toHaveClass('mm-banner-base__action');
  });

  it('should render bannerbase startAccessory', () => {
    const { getByTestId } = render(
      <BannerBase
        startAccessory={
          <Icon
            data-testid="start-accessory"
            name={ICON_NAMES.ADD_SQUARE_FILLED}
          />
        }
      />,
    );

    expect(getByTestId('start-accessory')).toBeDefined();
  });

  it('should render and fire onClose event', async () => {
    const onClose = jest.fn();
    const { user, getByTestId } = renderWithUserEvent(
      <BannerBase
        title="onClose Test"
        closeButtonProps={{ 'data-testid': 'close-button' }}
        onClose={onClose}
      />,
    );
    await user.click(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
