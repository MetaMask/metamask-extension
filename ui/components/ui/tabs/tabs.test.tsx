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

  it('resets nested content scroll position when switching tabs', () => {
    const { getByTestId, getByText } = render(
      <Tabs onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          <div data-testid="tab-content">Tab 1 Content</div>
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          <div data-testid="tab-content">Tab 2 Content</div>
        </Tab>
      </Tabs>,
    );
    const initialContent = getByTestId('tab-content');
    initialContent.scrollTop = 100;

    fireEvent.click(getByText('Tab 2'));

    const activeContent = getByTestId('tab-content');
    expect(activeContent).not.toBe(initialContent);
    expect(activeContent.scrollTop).toBe(0);
  });

  it('keeps clicked tab content visible while activeTab prop is still stale', () => {
    const onTabClick = jest.fn();
    const { getByText, queryByText } = render(
      <Tabs activeTab="tab1" onTabClick={onTabClick}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    fireEvent.click(getByText('Tab 2'));

    expect(onTabClick).toHaveBeenCalledWith('tab2');
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

  describe('keyboard navigation', () => {
    const renderKeyboardTabs = (onTabClick = jest.fn()) => {
      const result = render(
        <Tabs activeTab="tab1" onTabClick={onTabClick}>
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

      const tabList = result.getByRole('tablist');
      const tabs = result.getAllByRole('tab');
      return { ...result, onTabClick, tabList, tabs };
    };

    it('moves to the next tab on ArrowRight', () => {
      const { getByText, queryByText, onTabClick, tabList, tabs } =
        renderKeyboardTabs();

      tabs[0].focus();
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });

      expect(onTabClick).toHaveBeenCalledWith('tab2');
      expect(queryByText('Tab 1 Content')).not.toBeInTheDocument();
      expect(getByText('Tab 2 Content')).toBeInTheDocument();
      expect(tabs[1]).toHaveFocus();
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('tabIndex', '0');
      expect(tabs[0]).toHaveAttribute('tabIndex', '-1');
    });

    it('moves to the previous tab on ArrowLeft and wraps from first to last', () => {
      const { getByText, queryByText, onTabClick, tabList, tabs } =
        renderKeyboardTabs();

      tabs[0].focus();
      fireEvent.keyDown(tabList, { key: 'ArrowLeft' });

      expect(onTabClick).toHaveBeenCalledWith('tab3');
      expect(queryByText('Tab 1 Content')).not.toBeInTheDocument();
      expect(getByText('Tab 3 Content')).toBeInTheDocument();
      expect(tabs[2]).toHaveFocus();
    });

    it('wraps from last to first on ArrowRight', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole, getAllByRole } = render(
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

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      tabs[2].focus();
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });

      expect(onTabClick).toHaveBeenCalledWith('tab1');
      expect(getByText('Tab 1 Content')).toBeInTheDocument();
      expect(tabs[0]).toHaveFocus();
    });

    it('moves to the first enabled tab on Home', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole, getAllByRole } = render(
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

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      tabs[2].focus();
      fireEvent.keyDown(tabList, { key: 'Home' });

      expect(onTabClick).toHaveBeenCalledWith('tab1');
      expect(getByText('Tab 1 Content')).toBeInTheDocument();
      expect(tabs[0]).toHaveFocus();
    });

    it('moves to the last enabled tab on End', () => {
      const { getByText, queryByText, onTabClick, tabList, tabs } =
        renderKeyboardTabs();

      tabs[0].focus();
      fireEvent.keyDown(tabList, { key: 'End' });

      expect(onTabClick).toHaveBeenCalledWith('tab3');
      expect(queryByText('Tab 1 Content')).not.toBeInTheDocument();
      expect(getByText('Tab 3 Content')).toBeInTheDocument();
      expect(tabs[2]).toHaveFocus();
    });

    it('skips disabled tabs when navigating with arrow keys', () => {
      const onTabClick = jest.fn();
      const { getByText, queryByText, getByRole, getAllByRole } = render(
        <Tabs activeTab="tab1" onTabClick={onTabClick}>
          <Tab tabKey="tab1" name="Tab 1">
            Tab 1 Content
          </Tab>
          <Tab tabKey="tab2" name="Tab 2" disabled>
            Tab 2 Content
          </Tab>
          <Tab tabKey="tab3" name="Tab 3">
            Tab 3 Content
          </Tab>
        </Tabs>,
      );

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      tabs[0].focus();
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });

      expect(onTabClick).toHaveBeenCalledWith('tab3');
      expect(onTabClick).not.toHaveBeenCalledWith('tab2');
      expect(queryByText('Tab 2 Content')).not.toBeInTheDocument();
      expect(getByText('Tab 3 Content')).toBeInTheDocument();
      expect(tabs[2]).toHaveFocus();
    });

    it('skips disabled tabs when using Home and End', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole, getAllByRole } = render(
        <Tabs activeTab="tab2" onTabClick={onTabClick}>
          <Tab tabKey="tab1" name="Tab 1" disabled>
            Tab 1 Content
          </Tab>
          <Tab tabKey="tab2" name="Tab 2">
            Tab 2 Content
          </Tab>
          <Tab tabKey="tab3" name="Tab 3" disabled>
            Tab 3 Content
          </Tab>
        </Tabs>,
      );

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      tabs[1].focus();
      fireEvent.keyDown(tabList, { key: 'Home' });
      expect(onTabClick).not.toHaveBeenCalled();
      expect(getByText('Tab 2 Content')).toBeInTheDocument();
      expect(tabs[1]).toHaveFocus();

      fireEvent.keyDown(tabList, { key: 'End' });
      expect(onTabClick).not.toHaveBeenCalled();
      expect(getByText('Tab 2 Content')).toBeInTheDocument();
      expect(tabs[1]).toHaveFocus();
    });

    it('does not navigate when every tab is disabled', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole } = render(
        <Tabs activeTab="tab1" onTabClick={onTabClick}>
          <Tab tabKey="tab1" name="Tab 1" disabled>
            Tab 1 Content
          </Tab>
          <Tab tabKey="tab2" name="Tab 2" disabled>
            Tab 2 Content
          </Tab>
        </Tabs>,
      );

      const tabList = getByRole('tablist');
      fireEvent.keyDown(tabList, { key: 'ArrowRight' });
      fireEvent.keyDown(tabList, { key: 'Home' });
      fireEvent.keyDown(tabList, { key: 'End' });

      expect(onTabClick).not.toHaveBeenCalled();
      expect(getByText('Tab 1 Content')).toBeInTheDocument();
    });

    it('falls back from a disabled active tab to the previous enabled tab', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole, getAllByRole } = render(
        <Tabs activeTab="tab2" onTabClick={onTabClick}>
          <Tab tabKey="tab1" name="Tab 1">
            Tab 1 Content
          </Tab>
          <Tab tabKey="tab2" name="Tab 2" disabled>
            Tab 2 Content
          </Tab>
          <Tab tabKey="tab3" name="Tab 3">
            Tab 3 Content
          </Tab>
        </Tabs>,
      );

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      fireEvent.keyDown(tabList, { key: 'ArrowRight' });

      expect(onTabClick).toHaveBeenCalledWith('tab3');
      expect(getByText('Tab 3 Content')).toBeInTheDocument();
      expect(tabs[2]).toHaveFocus();
    });

    it('falls back to the first enabled tab when the active tab is disabled and has no prior enabled tab', () => {
      const onTabClick = jest.fn();
      const { getByText, getByRole, getAllByRole } = render(
        <Tabs activeTab="tab1" onTabClick={onTabClick}>
          <Tab tabKey="tab1" name="Tab 1" disabled>
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

      const tabList = getByRole('tablist');
      const tabs = getAllByRole('tab');

      fireEvent.keyDown(tabList, { key: 'Home' });

      expect(onTabClick).toHaveBeenCalledWith('tab2');
      expect(getByText('Tab 2 Content')).toBeInTheDocument();
      expect(tabs[1]).toHaveFocus();
    });

    it('ignores keys that are not part of the tabs keyboard pattern', () => {
      const { onTabClick, tabList, getByText } = renderKeyboardTabs();

      fireEvent.keyDown(tabList, { key: 'Enter' });
      fireEvent.keyDown(tabList, { key: 'a' });

      expect(onTabClick).not.toHaveBeenCalled();
      expect(getByText('Tab 1 Content')).toBeInTheDocument();
    });
  });

  it('clamps to last tab when activeTab key does not exist', () => {
    const { getByText } = render(
      <Tabs activeTab={'nonexistent' as string} onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
        <Tab tabKey="tab2" name="Tab 2">
          Tab 2 Content
        </Tab>
      </Tabs>,
    );

    expect(getByText('Tab 1 Content')).toBeInTheDocument();
  });

  it('does not crash when children are removed and activeTabIndex is out of bounds', () => {
    const { rerender, getByText } = render(
      <Tabs activeTab="tab3" onTabClick={() => null}>
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

    expect(getByText('Tab 3 Content')).toBeInTheDocument();

    rerender(
      <Tabs activeTab="tab3" onTabClick={() => null}>
        <Tab tabKey="tab1" name="Tab 1">
          Tab 1 Content
        </Tab>
      </Tabs>,
    );

    expect(getByText('Tab 1 Content')).toBeInTheDocument();
  });
});
