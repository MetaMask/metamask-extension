/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';

import { renderWithUserEvent } from '../../../../test/lib/render-helpers';

import { Icon, ICON_NAMES } from '..';
import { Banner } from './banner';

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

  it('should render banner title', () => {
    const { getByText } = render(<Banner title="Banner title test" />);
    expect(getByText('Banner title test')).toHaveClass('mm-banner__title');
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
          icon: ICON_NAMES.ARROW_2_RIGHT, // TODO: change to iconName
          iconPositionRight: true,
          'data-testid': 'action',
          className: 'mm-banner__action',
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
    expect(getByTestId('action')).toHaveClass('mm-banner__action');
  });

  it('should render banner startAccessory', () => {
    const { getByTestId } = render(
      <Banner
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
