import React, { useContext } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TextVariant } from '@metamask/design-system-react';
import {
  BatchSellInfoModalProvider,
  BatchSellInfoModalContext,
} from './batch-sell-info-modal-provider';

const MODAL_PROPS = {
  titleProps: { variant: TextVariant.HeadingSm, children: 'Info title' },
  descriptionProps: {
    variant: TextVariant.BodySm,
    children: 'Info description',
  },
};

const MODAL_PROPS_WITH_CTA = {
  ...MODAL_PROPS,
  ctaProps: { text: 'CTA button text', onClick: jest.fn() },
};

/**
 * Helper component that exercises the context via useBatchSellInfoModal.
 */
const TestConsumer = () => {
  const { openModal, closeModal, isInfoModalOpen } = useContext(
    BatchSellInfoModalContext,
  );

  return (
    <div>
      <span data-testid="is-open">{String(isInfoModalOpen)}</span>
      <button onClick={() => openModal(MODAL_PROPS)}>open</button>
      <button onClick={() => openModal(MODAL_PROPS_WITH_CTA)}>
        open with cta
      </button>
      <button onClick={closeModal}>close</button>
    </div>
  );
};

const renderWithProvider = () =>
  render(
    <BatchSellInfoModalProvider>
      <TestConsumer />
    </BatchSellInfoModalProvider>,
  );

describe('BatchSellInfoModalProvider', () => {
  describe('initial state', () => {
    it('exposes isInfoModalOpen as false', () => {
      renderWithProvider();

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });

    it('does not render the info modal', () => {
      renderWithProvider();

      expect(screen.queryByText('Info title')).not.toBeInTheDocument();
    });

    it('renders children', () => {
      renderWithProvider();

      expect(screen.getByText('open')).toBeInTheDocument();
    });
  });

  describe('openModal', () => {
    it('sets isInfoModalOpen to true', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });

      expect(screen.getByTestId('is-open')).toHaveTextContent('true');
    });

    it('renders the modal with the provided title and description', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });

      expect(screen.getByText('Info title')).toBeInTheDocument();
      expect(screen.getByText('Info description')).toBeInTheDocument();
    });

    it('renders the CTA button when ctaProps are provided', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open with cta'));
      });

      expect(screen.getByText('CTA button text')).toBeInTheDocument();
    });

    it('replaces the previous modal props when called again', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });
      act(() => {
        fireEvent.click(screen.getByText('open with cta'));
      });

      expect(screen.getByText('CTA button text')).toBeInTheDocument();
    });
  });

  describe('closeModal', () => {
    it('sets isInfoModalOpen to false', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });
      act(() => {
        fireEvent.click(screen.getByText('close'));
      });

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
    });

    it('hides the modal content', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });
      act(() => {
        fireEvent.click(screen.getByText('close'));
      });

      expect(screen.queryByText('Info title')).not.toBeInTheDocument();
    });
  });

  describe('modal self-close', () => {
    it('closes when the modal header close button is clicked', () => {
      renderWithProvider();

      act(() => {
        fireEvent.click(screen.getByText('open'));
      });

      fireEvent.click(screen.getByLabelText('[close]'));

      expect(screen.getByTestId('is-open')).toHaveTextContent('false');
      expect(screen.queryByText('Info title')).not.toBeInTheDocument();
    });
  });
});
