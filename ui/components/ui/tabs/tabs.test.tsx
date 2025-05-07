import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Tabs from './tabs.component';
import Tab from './tab/tab.component';

describe('Tabs', () => {
  const renderTabs = (props = {}) => {
    const defaultProps = {
      defaultActiveTabKey: '',
      onTabClick: () => null,
      tabsClassName: '',
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

  it('renders with defaultActiveTabKey', () => {
    const { getByText, queryByText } = renderTabs({
      defaultActiveTabKey: 'tab2',
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

  it('applies tabsClassName to the tab list', () => {
    const { container } = renderTabs({ tabsClassName: 'custom-tabs-class' });

    expect(container.querySelector('.tabs__list')).toHaveClass(
      'custom-tabs-class',
    );
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
      <Tabs defaultActiveTabKey="" onTabClick={() => null}>
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
      <Tabs defaultActiveTabKey="" onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2" disabled>
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    const disabledTab = getByText('Tab 2').closest('li');
    expect(disabledTab).toHaveClass('tab--disabled');

    const disabledButton = getByText('Tab 2').closest('button');
    expect(disabledButton).toHaveAttribute('disabled');
  });

  it('does not switch to disabled tab when clicked', () => {
    const { getByText, queryByText } = render(
      <Tabs defaultActiveTabKey="tab1" onTabClick={() => null}>
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
      <Tabs defaultActiveTabKey="tab1" onTabClick={onTabClick}>
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
});
