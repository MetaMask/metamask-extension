/**
 * Perps Controller
 *
 * This module re-exports the PerpsController from @metamask/perps-controller
 * and provides the extension-specific infrastructure wiring.
 *
 * For the PoC, most consumers should import directly from '@metamask/perps-controller'.
 * This file exists primarily to export `createPerpsInfrastructure` which wires
 * the controller to extension services (AccountsController, KeyringController, etc.).
 */

// Export infrastructure for creating the controller (extension-specific)
export { createPerpsInfrastructure } from './infrastructure';

// Re-export everything from the package for convenience
export * from '@metamask/perps-controller';
