import React from 'react';
import { render, fireEvent, screen, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import { TextVariant } from '@metamask/design-system-react';
import { BatchSellInfoModalProvider } from '../providers/BatchSellInfoModalProvider';
import { useBatchSellnfoModal } from './useBatchSellInfoModal';

const MODAL_PROPS = {
  titleProps: { children: 'Test title', variant: TextVariant.HeadingSm },
  descriptionProps: {
    children: 'Test description',
    variant: TextVariant.BodySm,
  },
  ctaProps: { text: 'Confirm CTA', onClick: jest.fn() },
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <BatchSellInfoModalProvider>{children}</BatchSellInfoModalProvider>
);

describe('useBatchSellModal', () => {
  it('returns openModal and closeModal from the context', () => {
    const { result } = renderHook(() => useBatchSellnfoModal(), { wrapper });

    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
  });

  it('throws (returns default no-op context) when used outside the provider', () => {
    // Without the provider the context falls back to its default value
    // (no-ops), so the hook call itself must not throw.
    const { result } = renderHook(() => useBatchSellnfoModal());

    expect(typeof result.current.openModal).toBe('function');
    expect(typeof result.current.closeModal).toBe('function');
  });

  describe('openModal', () => {
    it('displays the modal with title and description when called', () => {
      const { result } = renderHook(() => useBatchSellnfoModal(), { wrapper });

      act(() => {
        result.current.openModal(MODAL_PROPS);
      });

      expect(screen.getByText('Test title')).toBeInTheDocument();
      expect(screen.getByText('Test description')).toBeInTheDocument();
    });

    it('displays the CTA button text when ctaProps is provided', () => {
      const { result } = renderHook(() => useBatchSellnfoModal(), { wrapper });

      act(() => {
        result.current.openModal(MODAL_PROPS);
      });

      expect(screen.getByText('Confirm CTA')).toBeInTheDocument();
    });

    it('does not show modal content before openModal is called', () => {
      renderHook(() => useBatchSellnfoModal(), { wrapper });

      expect(screen.queryByText('Test title')).not.toBeInTheDocument();
    });
  });

  describe('closeModal', () => {
    it('hides the modal when called after openModal', () => {
      const { result } = renderHook(() => useBatchSellnfoModal(), { wrapper });

      act(() => {
        result.current.openModal(MODAL_PROPS);
      });
      expect(screen.getByText('Test title')).toBeInTheDocument();

      act(() => {
        result.current.closeModal();
      });

      expect(screen.queryByText('Test title')).not.toBeInTheDocument();
    });

    it('is also triggered when the modal header close button is clicked', () => {
      const { result } = renderHook(() => useBatchSellnfoModal(), { wrapper });

      act(() => {
        result.current.openModal(MODAL_PROPS);
      });

      fireEvent.click(screen.getByLabelText('[close]'));

      expect(screen.queryByText('Test title')).not.toBeInTheDocument();
    });
  });

  describe('consumer component integration', () => {
    it('wires openModal and closeModal to UI actions correctly', () => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const TestConsumer = () => {
        const { openModal, closeModal } = useBatchSellnfoModal();
        return (
          <>
            <button onClick={() => openModal(MODAL_PROPS)}>Open modal</button>
            <button onClick={closeModal}>Close modal</button>
          </>
        );
      };

      render(
        <BatchSellInfoModalProvider>
          <TestConsumer />
        </BatchSellInfoModalProvider>,
      );

      expect(screen.queryByText('Test title')).not.toBeInTheDocument();

      fireEvent.click(screen.getByText('Open modal'));
      expect(screen.getByText('Test title')).toBeInTheDocument();

      fireEvent.click(screen.getByText('Close modal'));
      expect(screen.queryByText('Test title')).not.toBeInTheDocument();
    });
  });
});
