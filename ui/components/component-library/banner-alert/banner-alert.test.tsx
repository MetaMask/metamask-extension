/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { BannerAlert, BannerAlertSeverity } from '.';

describe('BannerAlert', () => {
  it('should render BannerAlert element correctly', () => {
    const { getByTestId, container } = render(
      <BannerAlert data-testid="bannerAlert" title="BannerAlert test">
        should render BannerAlert element correctly
      </BannerAlert>,
    );
    expect(getByTestId('bannerAlert')).toHaveClass('mm-banner-alert');
    expect(container).toMatchSnapshot();
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <BannerAlert
        className="mm-banner-alert--test"
        data-testid="bannerAlert"
        title="BannerAlert test"
      >
        should render BannerAlert element correctly
      </BannerAlert>,
    );
    expect(getByTestId('bannerAlert')).toHaveClass('mm-banner-alert--test');
  });

  it('should render with different severity classnames', () => {
    const { getByTestId } = render(
      <>
        <BannerAlert data-testid="info" title="Info">
          This is a demo of severity Info.
        </BannerAlert>
        <BannerAlert
          data-testid="warning"
          severity={BannerAlertSeverity.Warning}
          title="Warning"
        >
          This is a demo of severity Warning.
        </BannerAlert>
        <BannerAlert
          data-testid="danger"
          severity={BannerAlertSeverity.Danger}
          title="Danger"
        >
          This is a demo of severity Danger.
        </BannerAlert>
        <BannerAlert
          data-testid="success"
          severity={BannerAlertSeverity.Success}
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

  it('should render BannerAlert title', () => {
    const { getByText } = render(
      <BannerAlert title="BannerAlert title test" />,
    );
    expect(getByText('BannerAlert title test')).toBeDefined();
  });

  it('should render BannerAlert description', () => {
    const { getByText } = render(
      <BannerAlert description="BannerAlert description test" />,
    );
    expect(getByText('BannerAlert description test')).toBeDefined();
  });

  it('should render BannerAlert action button', () => {
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
