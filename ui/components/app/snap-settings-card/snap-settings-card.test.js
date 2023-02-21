import * as React from 'react';
import { render, fireEvent } from '@testing-library/react';
import SnapSettingsCard from '.';

describe('SnapSettingsCard', () => {
  const args = {
    name: 'Snap name',
    description:
      'This snap provides developers everywhere access to an entirely new data storage paradigm, even letting your programs store data autonomously.',
    dateAdded: new Date().toDateString(),
    version: '10.5.1234',
    url: 'https://metamask.io',
    status: 'stopped',
    icon: './AST.png',
  };
  it('should render the SnapsSettingCard without crashing', () => {
    const { getByText } = render(<SnapSettingsCard {...args} />);
    expect(getByText('Snap name')).toBeDefined();
  });

  it('should render the pill as installing when given a status of installing', () => {
    args.status = 'installing';
    const { getByText } = render(<SnapSettingsCard {...args} />);
    expect(getByText('installing')).toBeDefined();
  });

  it('should render the pill as running when given a status of running', () => {
    args.status = 'running';
    const { getByText } = render(<SnapSettingsCard {...args} />);
    expect(getByText('running')).toBeDefined();
  });

  it('should render the pill as installing when given a status of stopped', () => {
    args.status = 'stopped';
    const { getByText } = render(<SnapSettingsCard {...args} />);
    expect(getByText('stopped')).toBeDefined();
  });

  it('should render the pill as crashed when given a status of crashed', () => {
    args.status = 'crashed';
    const { getByText } = render(<SnapSettingsCard {...args} />);
    expect(getByText('crashed')).toBeDefined();
  });

  it('should call onToggle prop when toggle button is clicked', () => {
    const onToggle = jest.fn();
    args.onToggle = onToggle;
    const { container } = render(<SnapSettingsCard {...args} />);
    const toggleBtn = container.querySelector('.toggle-button').firstChild;
    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalled();
  });

  it('should call onClick prop when See Details button is clicked', () => {
    const onClick = jest.fn();
    args.onClick = onClick;
    const { container } = render(<SnapSettingsCard {...args} />);
    const seeDetailsBtn = container.querySelector(
      '.snap-settings-card__button',
    );
    fireEvent.click(seeDetailsBtn);
    expect(onClick).toHaveBeenCalled();
  });

  it('should render an icon image', () => {
    const { getByAltText } = render(<SnapSettingsCard {...args} />);
    const image = getByAltText(args.name);
    expect(image).toBeDefined();
    expect(image).toHaveAttribute('src', args.icon);
  });

  it('should render the icon fallback using the first letter of the name', () => {
    const { getByText } = render(<SnapSettingsCard {...args} icon="" />);
    expect(getByText('S')).toBeDefined();
  });
});
