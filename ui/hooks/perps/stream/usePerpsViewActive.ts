import { useEffect } from 'react';
import { submitRequestToBackground } from '../../../store/background-connection';

/**
 * Signals whether a Perps view is currently active for this UI connection.
 *
 * The background Perps stream bridge only emits while `perpsViewActive` is true.
 * Use this in Perps entry boundaries (route layout, tab boundary), not leaf views.
 *
 * @param source - Identifier used in debug logs
 */
export function usePerpsViewActive(source: string): void {
  useEffect(() => {
    submitRequestToBackground('perpsViewActive', [true]).catch((err) => {
      // Background may not be ready yet; activation can still occur once perpsInit resolves.
      console.debug(`[${source}] perpsViewActive(true) failed:`, err);
    });

    return () => {
      submitRequestToBackground('perpsViewActive', [false]).catch((err) => {
        // Expected when the port closes before unmount (popup teardown).
        console.debug(`[${source}] perpsViewActive(false) failed:`, err);
      });
    };
  }, [source]);
}
