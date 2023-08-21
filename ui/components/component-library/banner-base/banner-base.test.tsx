/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Icon, IconName } from '..';
import { BannerBase } from './banner-base';

describe('BannerBase', () => {
  it('should render BannerBase element correctly', () => {
    const { getByTestId, container } = render(
      <BannerBase data-testid="banner-base" title="BannerBase test">
        should render BannerBase element correctly
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
        title="BannerBase test"
      >
        should render BannerBase element correctly
      </BannerBase>,
    );
    expect(getByTestId('banner-base')).toHaveClass('mm-banner-base--test');
  });

  it('should render BannerBase title', () => {
    const { getByText, getByTestId } = render(
      <BannerBase
        title="BannerBase title test"
        titleProps={{ 'data-testid': 'title' }}
      />,
    );

    expect(getByText('BannerBase title test')).toBeDefined();
    expect(getByTestId('title')).toBeDefined();
  });

  it('should render BannerBase description', () => {
    const { getByText, getByTestId } = render(
      <BannerBase
        description="BannerBase description test"
        descriptionProps={{ 'data-testid': 'description' }}
      />,
    );
    expect(getByText('BannerBase description test')).toBeDefined();
    expect(getByTestId('description')).toBeDefined();
  });

  it('should render BannerBase children with props', () => {
    const { getByText, getByTestId } = render(
      <BannerBase
        childrenWrapperProps={{
          'data-testid': 'children-wrapper',
        }}
      >
        BannerBase children
      </BannerBase>,
    );
    expect(getByTestId('children-wrapper')).toBeDefined();
    expect(getByText('BannerBase children')).toBeDefined();
  });

  it('should render BannerBase children without wrapper when not a string', () => {
    const { getByText, queryByTestId } = render(
      <BannerBase
        childrenWrapperProps={{
          'data-testid': 'children-wrapper',
        }}
      >
        <div>BannerBase children</div>
      </BannerBase>,
    );

    expect(queryByTestId('children-wrapper')).not.toBeInTheDocument();
    expect(getByText('BannerBase children')).toBeDefined();
  });

  it('should render BannerBase action button', () => {
    const fn = jest.fn();
    const { getByTestId } = render(
      <BannerBase
        title="Action prop demo"
        actionButtonLabel="Action"
        actionButtonProps={{
          endIconName: IconName.Arrow2Right,
          'data-testid': 'action',
          className: 'mm-banner-base__action',
        }}
        actionButtonOnClick={fn}
      >
        BannerBase children
      </BannerBase>,
    );
    expect(getByTestId('action')).toHaveClass('mm-banner-base__action');
  });

  it('should render BannerBase startAccessory', () => {
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
