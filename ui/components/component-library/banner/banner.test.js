/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Banner, BANNER_SEVERITIES } from '.';

describe('Banner', () => {
  it('should render banner element correctly', () => {
    const { getByTestId, container } = render(
      <Banner data-testid="banner" title="Banner test">
        should render banner element correctly
      </Banner>,
    );
    expect(getByTestId('banner')).toHaveClass('mm-banner');
    expect(container).toMatchSnapshot();
  });

  it('should render with added classname', () => {
    const { getByTestId } = render(
      <Banner
        className="mm-banner--test"
        data-testid="banner"
        title="Banner test"
      >
        should render banner element correctly
      </Banner>,
    );
    expect(getByTestId('banner')).toHaveClass('mm-banner--test');
  });

  it('should render with different severity classnames', () => {
    const { getByTestId } = render(
      <>
        <Banner data-testid="info" title="Info">
          This is a demo of severity Info.
        </Banner>
        <Banner
          data-testid="warning"
          severity={BANNER_SEVERITIES.WARNING}
          title="Warning"
        >
          This is a demo of severity Warning.
        </Banner>
        <Banner
          data-testid="danger"
          severity={BANNER_SEVERITIES.DANGER}
          title="Danger"
        >
          This is a demo of severity Danger.
        </Banner>
        <Banner
          data-testid="success"
          severity={BANNER_SEVERITIES.SUCCESS}
          title="Success"
        >
          This is a demo of severity Success.
        </Banner>
      </>,
    );
    expect(getByTestId('info')).toHaveClass('mm-banner--severity-info');
    expect(getByTestId('warning')).toHaveClass('mm-banner--severity-warning');
    expect(getByTestId('danger')).toHaveClass('mm-banner--severity-danger');
    expect(getByTestId('success')).toHaveClass('mm-banner--severity-success');
  });

  it('should render banner title', () => {
    const { getByText } = render(<Banner title="Banner title test" />);
    expect(getByText('Banner title test')).toHaveClass('mm-banner-base__title');
  });

  it('should render banner description', () => {
    const { getByText } = render(<Banner>Banner description test</Banner>);
    expect(getByText('Banner description test')).toBeDefined();
  });

  it('should render banner action button', () => {
    const { getByTestId } = render(
      <Banner
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
      </Banner>,
    );
    expect(getByTestId('action')).toHaveClass('mm-banner-base__action');
  });

  it('should render and fire onClose event', async () => {
    const onClose = jest.fn();
    const { user, getByTestId } = renderWithUserEvent(
      <Banner
        title="onClose Test"
        closeButtonProps={{ 'data-testid': 'close-button' }}
        onClose={onClose}
      />,
    );
    await user.click(getByTestId('close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
