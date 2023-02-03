/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { BannerAlert, BANNER_SEVERITIES } from '.';

describe('Banner', () => {
  it('should render banner element correctly', () => {
    const { getByTestId, container } = render(
      <BannerAlert data-testid="banner" title="Banner test">
        should render banner element correctly
      </BannerAlert>,
    );
    expect(getByTestId('banner')).toHaveClass('mm-banner');
    expect(container).toMatchSnapshot();
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <BannerAlert
        className="mm-banner-alert--test"
        data-testid="banner"
        title="Banner test"
      >
        should render banner element correctly
      </BannerAlert>,
    );
    expect(getByTestId('banner')).toHaveClass('mm-banner-alert--test');
  });

  it('should render with different severity classnames', () => {
    const { getByTestId } = render(
      <>
        <BannerAlert data-testid="info" title="Info">
          This is a demo of severity Info.
        </BannerAlert>
        <BannerAlert
          data-testid="warning"
          severity={BANNER_SEVERITIES.WARNING}
          title="Warning"
        >
          This is a demo of severity Warning.
        </BannerAlert>
        <BannerAlert
          data-testid="danger"
          severity={BANNER_SEVERITIES.DANGER}
          title="Danger"
        >
          This is a demo of severity Danger.
        </BannerAlert>
        <BannerAlert
          data-testid="success"
          severity={BANNER_SEVERITIES.SUCCESS}
          title="Success"
        >
          This is a demo of severity Success.
        </BannerAlert>
      </>,
    );
    expect(getByTestId('info')).toHaveClass('mm-banner-alert--severity-info');
    expect(getByTestId('warning')).toHaveClass(
      'mm-banner-alert--severity-warning',
    );
    expect(getByTestId('danger')).toHaveClass(
      'mm-banner-alert--severity-danger',
    );
    expect(getByTestId('success')).toHaveClass(
      'mm-banner-alert--severity-success',
    );
  });

  it('should render banner title', () => {
    const { getByText } = render(<BannerAlert title="Banner title test" />);
    expect(getByText('Banner title test')).toHaveClass('mm-banner-base__title');
  });

  it('should render banner description', () => {
    const { getByText } = render(
      <BannerAlert description="Banner description test" />,
    );
    expect(getByText('Banner description test')).toBeDefined();
  });

  it('should render banner action button', () => {
    const { getByTestId } = render(
      <BannerAlert
        title="Action prop demo"
        actionButtonLabel="Action"
        actionButtonProps={{
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
      </BannerAlert>,
    );
    expect(getByTestId('action')).toHaveClass('mm-banner-base__action');
  });

  it('should render and fire onClose event', async () => {
    const onClose = jest.fn();
    const { user, getByTestId } = renderWithUserEvent(
      <BannerAlert
        title="onClose Test"
        closeButtonProps={{ 'data-testid': 'close-button' }}
        onClose={onClose}
      />,
    );
    await user.click(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
