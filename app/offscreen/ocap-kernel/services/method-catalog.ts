import { makeDefaultExo } from '@metamask/kernel-utils/exo';
import catalogData from './method-catalog-data.json';

type MethodEntry = {
  name: string;
  signature: string;
  description: string;
};

/**
 * Creates the method catalog exo that provides query access
 * to the curated set of controller messenger actions.
 *
 * @returns An exo with methods for querying the method catalog.
 */
export function makeMethodCatalog() {
  const entries: MethodEntry[] = catalogData;

  const byController = new Map<string, MethodEntry[]>();
  for (const entry of entries) {
    const controller = entry.name.split(':')[0];
    const existing = byController.get(controller);
    if (existing) {
      existing.push(entry);
    } else {
      byController.set(controller, [entry]);
    }
  }

  return makeDefaultExo('methodCatalog', {
    getAllMethods(): MethodEntry[] {
      return entries;
    },

    getControllers(): string[] {
      return [...byController.keys()];
    },

    getMethodsByController(controller: string): MethodEntry[] {
      return byController.get(controller) ?? [];
    },

    search(query: string): MethodEntry[] {
      const lower = query.toLowerCase();
      return entries.filter(
        (entry) =>
          entry.name.toLowerCase().includes(lower) ||
          entry.description.toLowerCase().includes(lower),
      );
    },
  });
}
