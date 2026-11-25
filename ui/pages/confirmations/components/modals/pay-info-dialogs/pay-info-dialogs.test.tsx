import React from 'react';
import { fireEvent, screen } from '@testing-library/react';
import { TextColor } from '@metamask/design-system-react';
import configureStore from '../../../../../store/store';
import mockState from '../../../../../../test/data/mock-state.json';
import { renderWithProvider } from '../../../../../../test/lib/render-helpers-navigate';
import {
  PayCheckList,
  PayChecklistDialog,
  PayInfoDialog,
  PaySectionsDialog,
} from '.';

const store = configureStore(mockState);

describe('PayInfoDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <PayInfoDialog
        data-testid="pay-info-dialog"
        isOpen={false}
        onClose={jest.fn()}
      >
        <span>Dialog body</span>
      </PayInfoDialog>,
      store,
    );

    expect(screen.queryByTestId('pay-info-dialog')).not.toBeInTheDocument();
  });

  it('renders content and calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <PayInfoDialog
        data-testid="pay-info-dialog"
        headerTitle={<span>MetaMask Pay</span>}
        isOpen
        onClose={onClose}
      >
        <span>Dialog body</span>
      </PayInfoDialog>,
      store,
    );

    expect(screen.getByTestId('pay-info-dialog')).toHaveTextContent(
      'MetaMask Pay',
    );
    expect(screen.getByText('Dialog body')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pay-info-dialog-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PayCheckList', () => {
  it('renders each checklist item title and body', () => {
    renderWithProvider(
      <PayCheckList
        items={[
          {
            body: 'First body',
            id: 'first',
            itemTestId: 'item-first',
            title: 'First title',
            titleTestId: 'title-first',
          },
          {
            body: 'Second body',
            id: 'second',
            title: 'Second title',
          },
        ]}
      />,
      store,
    );

    expect(screen.getByTestId('item-first')).toHaveTextContent('First body');
    expect(screen.getByTestId('title-first')).toHaveTextContent('First title');
    expect(screen.getByText('Second title')).toBeInTheDocument();
    expect(screen.getByText('Second body')).toBeInTheDocument();
  });
});

describe('PaySectionsDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <PaySectionsDialog
        data-testid="pay-sections-dialog"
        isOpen={false}
        onClose={jest.fn()}
        sections={[]}
        title="6.2% APY"
      />,
      store,
    );

    expect(screen.queryByTestId('pay-sections-dialog')).not.toBeInTheDocument();
  });

  it('renders title, subtitle, lead, sections, and closes via X', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <PaySectionsDialog
        data-testid="pay-sections-dialog"
        isOpen
        lead="Earn variable yield."
        onClose={onClose}
        sections={[
          { body: 'Body one', id: 'one', title: 'Section one' },
          { body: 'Body two', id: 'two', title: 'Section two' },
        ]}
        subtitle="Annual percentage yield"
        title="6.2% APY"
        titleColor={TextColor.SuccessDefault}
      />,
      store,
    );

    expect(screen.getByTestId('pay-sections-dialog-title')).toHaveTextContent(
      '6.2% APY',
    );
    expect(
      screen.getByTestId('pay-sections-dialog-subtitle'),
    ).toHaveTextContent('Annual percentage yield');
    expect(screen.getByTestId('pay-sections-dialog-lead')).toHaveTextContent(
      'Earn variable yield.',
    );
    expect(screen.getByText('Section one')).toBeInTheDocument();
    expect(screen.getByText('Body one')).toBeInTheDocument();
    expect(screen.getByText('Section two')).toBeInTheDocument();
    expect(screen.getByText('Body two')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('pay-sections-dialog-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('PayChecklistDialog', () => {
  it('renders nothing when closed', () => {
    renderWithProvider(
      <PayChecklistDialog
        data-testid="pay-checklist-dialog"
        isOpen={false}
        items={[]}
        lead="Overview copy"
        onClose={jest.fn()}
        title="Overview"
      />,
      store,
    );

    expect(
      screen.queryByTestId('pay-checklist-dialog'),
    ).not.toBeInTheDocument();
  });

  it('renders title, lead, checklist items, and closes via X', () => {
    const onClose = jest.fn();
    renderWithProvider(
      <PayChecklistDialog
        data-testid="pay-checklist-dialog"
        isOpen
        items={[
          {
            body: 'Always worth $1.',
            id: 'backed',
            title: 'Backed 1:1',
            titleTestId: 'pay-checklist-dialog-backed-title',
          },
        ]}
        lead="MetaMask USD summary."
        onClose={onClose}
        title="You'll receive $100"
      />,
      store,
    );

    expect(screen.getByTestId('pay-checklist-dialog-title')).toHaveTextContent(
      "You'll receive $100",
    );
    expect(screen.getByTestId('pay-checklist-dialog-lead')).toHaveTextContent(
      'MetaMask USD summary.',
    );
    expect(
      screen.getByTestId('pay-checklist-dialog-backed-title'),
    ).toHaveTextContent('Backed 1:1');

    fireEvent.click(screen.getByTestId('pay-checklist-dialog-close-button'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders header title and hero artwork when provided', () => {
    renderWithProvider(
      <PayChecklistDialog
        data-testid="pay-overview-dialog"
        headerTitle="MetaMask Pay"
        headerTitleTestId="pay-overview-dialog-title"
        heroImages={{
          backgroundSrc: './images/bg.svg',
          foregroundSrc: './images/fg.png',
        }}
        isOpen
        items={[
          {
            body: 'Fast settlement',
            id: 'settlement',
            title: 'Instant settlement',
          },
        ]}
        lead="Deposit and earn."
        leadTestId="pay-overview-dialog-description"
        onClose={jest.fn()}
        title="Do more with your cash"
        titleTestId="pay-overview-dialog-headline"
      />,
      store,
    );

    expect(screen.getByTestId('pay-overview-dialog-title')).toHaveTextContent(
      'MetaMask Pay',
    );
    expect(
      screen.getByTestId('pay-overview-dialog-headline'),
    ).toHaveTextContent('Do more with your cash');
    expect(
      screen.getByTestId('pay-overview-dialog-description'),
    ).toHaveTextContent('Deposit and earn.');
    expect(screen.getByText('Instant settlement')).toBeInTheDocument();
  });
});
