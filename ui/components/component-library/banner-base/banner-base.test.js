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
    expect(getByText('Bannerbase description test')).toHaveClass(
      'mm-banner-base__description',
    );
  });

  it('should render bannerbase action', () => {
    const { getByText } = render(<BannerBase action="Action" />);
    expect(getByText('Action')).toHaveClass('mm-banner-base__action');
  });

  it('should render bannerbase leftAccessory', () => {
    const { container } = render(
      <BannerBase
        leftAccessory={<Icon name={ICON_NAMES.ADD_SQUARE_FILLED} />}
      />,
    );

    const icon = container.getElementsByClassName(
      'mm-banner-base__left-accessory',
    ).length;
    expect(icon).toBe(1);
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
