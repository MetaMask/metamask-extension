/* eslint-disable jest/require-top-level-describe */
import { render } from '@testing-library/react';
import React from 'react';
import { renderWithUserEvent } from '../../../../test/lib/render-helpers';
import ExternalLink from '.';

const METAMASK_URL = 'https://metamask.io/';
describe('ExternalLink', () => {
  it('should render link element correctly with http href', () => {
    const { container } = render(
      <ExternalLink id="test-link" href={METAMASK_URL}>
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly with target', () => {
    const { container } = render(
      <ExternalLink id="test-link" href={METAMASK_URL} target="_self">
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with rel', () => {
    const { container } = render(
      <ExternalLink id="test-link" href={METAMASK_URL} rel="license">
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with referer', () => {
    const { container } = render(
      <ExternalLink id="test-link" href={METAMASK_URL} rel="license" referer>
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly target rel referer', () => {
    const { container } = render(
      <ExternalLink
        id="test-link"
        href={METAMASK_URL}
        rel="nofollow"
        target="self"
        referer
      >
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly className', () => {
    const { container } = render(
      <ExternalLink id="test-link" href={METAMASK_URL} className="test-class">
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly key', () => {
    const { container } = render(
      <ExternalLink href={METAMASK_URL} key="link">
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly onCLick', async () => {
    const mockOnClick = jest.fn();
    const { user, getByTestId, container } = renderWithUserEvent(
      <ExternalLink onClick={mockOnClick}>
        <button data-testid="test-label">test-button</button>
      </ExternalLink>,
    );
    const button = getByTestId('test-label');
    expect(mockOnClick).toHaveBeenCalledTimes(0);
    await user.click(button);
    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with title', () => {
    const { container } = render(
      <ExternalLink title="test-title" href={METAMASK_URL} rel="license">
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });

  it('should render link element correctly with type and style', () => {
    const { container } = render(
      <ExternalLink
        href={METAMASK_URL}
        referer
        type="link"
        key="non_custodial_link"
        style={{ color: 'red' }}
      >
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
  it('should render link element correctly with onClick target and rel', () => {
    const { container } = render(
      <ExternalLink
        href={METAMASK_URL}
        className="fee-card__link"
        onClick={() => ({})}
      >
        Link
      </ExternalLink>,
    );
    expect(container).toMatchSnapshot();
  });
});
