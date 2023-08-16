/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Icon, IconName } from '..';
import { TextVariant } from '../../../helpers/constants/design-system';
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
    const { getByText, getByTestId } = render(
      <BannerBase
        title="Bannerbase title test"
        titleProps={{ 'data-testid': 'title' }}
      />,
    );

    expect(getByText('Bannerbase title test')).toHaveClass(
      'mm-banner-base__title',
    );
    expect(getByTestId('title')).toBeDefined();
  });

  it('should render bannerbase description', () => {
    const { getByText } = render(
      <BannerBase description="Bannerbase description test" />,
    );
    expect(getByText('Bannerbase description test')).toBeDefined();
  });

  it('should render bannerbase children with props', () => {
    const { getByText, getByTestId } = render(
      <BannerBase
        childrenWrapperProps={{
          variant: TextVariant.bodyMd,
          'data-testid': 'childrenWrapper',
        }}
      >
        Bannerbase children test
      </BannerBase>,
    );
    expect(getByTestId('childrenWrapper')).toBeDefined();
    expect(getByText('Bannerbase children test')).toBeDefined();
  });

  it('should render bannerbase action button', () => {
    const { getByTestId } = render(
      <BannerBase
        title="Action prop demo"
        actionButtonLabel="Action"
        actionButtonProps={{
          endIconName: IconName.Arrow2Right,
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
          <Icon data-testid="start-accessory" name={IconName.AddSquare} />
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
