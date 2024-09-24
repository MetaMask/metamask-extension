import React from 'react';
import { render } from '@testing-library/react';
import { IconName } from '../../../../component-library';
import { SiteCellConnectionListItem } from './site-cell-connection-list-item';

describe('SiteCellConnectionListItem', () => {
  let getByTestId, container, getByText;

  const renderComponent = () => {
    const rendered = render(
      <SiteCellConnectionListItem
        title="Title"
        iconName={IconName.Wallet}
        connectedMessage="Connected Message"
        unconnectedMessage="Unconnected Message"
        isConnectFlow
        onClick={() => null}
        content={<div>Content</div>}
      />,
    );
    getByTestId = rendered.getByTestId;
    container = rendered.container;
    getByText = rendered.getByText;
  };

  beforeEach(() => {
    renderComponent();
  });

  it('renders correctly with required props', () => {
    expect(container).toMatchSnapshot();
    const siteCell = getByTestId('site-cell-connection-list-item');
    expect(siteCell).toBeDefined();
  });

  it('returns wallet icon correctly', () => {
    expect(getByText('Title')).toBeDefined();
  });
});
