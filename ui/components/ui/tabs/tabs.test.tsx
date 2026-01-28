import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import { Tabs } from './tabs';
import { Tab } from './tab/tab';

describe('Tabs', () => {
  const renderTabs = (props = {}) => {
    const defaultProps = {
      onTabClick: () => null,
      subHeader: null,
    };

    return render(
      <Tabs {...defaultProps} {...props}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
      </Tabs>,
    );
  };

  it('renders the tabs component', () => {
    const { getByText } = renderTabs();

    expect(getByText('Tab 1')).toBeInTheDocument();
    expect(getByText('Tab 2')).toBeInTheDocument();
    expect(getByText('Tab 1 Content')).toBeInTheDocument();
  });

  it('switches tabs when clicked', () => {
    const { getByText, queryByText } = renderTabs();

    fireEvent.click(getByText('Tab 2'));

    expect(queryByText('Tab 1 Content')).not.toBeInTheDocument();
    expect(getByText('Tab 2 Content')).toBeInTheDocument();
  });

  it('renders with activeTab', () => {
    const { getByText, queryByText } = renderTabs({
      activeTab: 'tab2',
    });

    expect(queryByText('Tab 1 Content')).not.toBeInTheDocument();
    expect(getByText('Tab 2 Content')).toBeInTheDocument();
  });

  it('calls onTabClick when tab is clicked', () => {
    const onTabClick = jest.fn();
    const { getByText } = renderTabs({ onTabClick });

    fireEvent.click(getByText('Tab 2'));

    expect(onTabClick).toHaveBeenCalledWith('tab2');
  });

  it('renders subHeader when provided', () => {
    const subHeader = <div data-testid="sub-header">Sub Header Content</div>;
    const { getByTestId } = renderTabs({ subHeader });

    expect(getByTestId('sub-header')).toBeInTheDocument();
  });

  it('applies tabListProps to the tab list', () => {
    const tabListProps = {
      'data-testid': 'tab-list',
      className: 'custom-list-class',
    };
    const { getByTestId } = renderTabs({ tabListProps });

    const tabList = getByTestId('tab-list');
    expect(tabList).toHaveClass('custom-list-class');
  });

  it('applies tabContentProps to the content container', () => {
    const tabContentProps = {
      'data-testid': 'tab-content',
      className: 'custom-content-class',
    };
    const { getByTestId } = renderTabs({ tabContentProps });

    const tabContent = getByTestId('tab-content');
    expect(tabContent).toHaveClass('custom-content-class');
  });

  it('spreads additional props to root element', () => {
    const { container } = renderTabs({
      'data-testid': 'tabs-root',
      className: 'custom-root-class',
    });

    const root = container.firstChild;
    expect(root).toHaveClass('custom-root-class');
    expect(root).toHaveAttribute('data-testid', 'tabs-root');
  });

  it('handles null children gracefully', () => {
    const { getByText } = render(
      <Tabs onTabClick={() => null}>
        {null}
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        {null}
      </Tabs>,
    );

    expect(getByText('Tab 1')).toBeInTheDocument();
    expect(getByText('Tab 1 Content')).toBeInTheDocument();
  });

  it('renders disabled tab with proper styling', () => {
    const { getByText } = render(
      <Tabs activeTab="tab1" onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2" disabled>
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    const disabledButton = getByText('Tab 2').closest('button');
    expect(disabledButton).toHaveAttribute('disabled');
  });

  it('does not switch to disabled tab when clicked', () => {
    const { getByText, queryByText } = render(
      <Tabs activeTab="tab1" onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2" disabled>
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    fireEvent.click(getByText('Tab 2'));

    expect(getByText('Tab 1 Content')).toBeInTheDocument();
    expect(queryByText('Tab 2 Content')).not.toBeInTheDocument();
  });

  it('does not call onTabClick when disabled tab is clicked', () => {
    const onTabClick = jest.fn();
    const { getByText } = render(
      <Tabs activeTab="tab1" onTabClick={onTabClick}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2" disabled>
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    fireEvent.click(getByText('Tab 2'));

    expect(onTabClick).not.toHaveBeenCalled();
  });

  it('falls back to first tab when active tab is removed', () => {
    const onTabClick = jest.fn();
    const { getByText, rerender, queryByText } = render(
      <Tabs activeTab="tab3" onTabClick={onTabClick}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
        <Tab tabKey="tab3" name="Tab 3">
          Tab 3 Content
        </Tab>
      </Tabs>,
    );

    // Initially showing Tab 3
    expect(getByText('Tab 3 Content')).toBeInTheDocument();

    // Remove Tab 3
    rerender(
      <Tabs activeTab="tab3" onTabClick={onTabClick}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    // Should fall back to Tab 1
    expect(getByText('Tab 1 Content')).toBeInTheDocument();
    expect(queryByText('Tab 3 Content')).not.toBeInTheDocument();
    expect(onTabClick).toHaveBeenCalledWith('tab1');
  });

  it('handles out of bounds activeTabIndex gracefully', () => {
    const onTabClick = jest.fn();
    // Start with 2 tabs but activeTab doesn't exist
    const { getByText } = render(
      <Tabs activeTab="nonexistent" onTabClick={onTabClick}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    // Should default to first tab
    expect(getByText('Tab 1 Content')).toBeInTheDocument();
  });
});
