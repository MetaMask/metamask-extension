import type { IKVStore } from "@metamask/mobile-wallet-protocol-core";

const MockStorage = new Map<string, string>();

/**
 * Browser-compatible localStorage-based implementation of IKVStore
 */
export class LocalStorageKVStore implements IKVStore {
	private readonly prefix: string;

	constructor(prefix: string = "mwp-") {
		this.prefix = prefix;
	}

	async get(key: string): Promise<string | null> {
		try {
			return MockStorage.get(this.getKey(key)) ?? null;
		} catch (error) {
			console.warn("Failed to get from localStorage:", error);
			return null;
		}
	}

	async set(key: string, value: string): Promise<void> {
		try {
			MockStorage.set(this.getKey(key), value);
		} catch (error) {
			console.warn("Failed to set in localStorage:", error);
			throw error;
		}
	}

	async delete(key: string): Promise<void> {
		try {
			MockStorage.delete(this.getKey(key));
		} catch (error) {
			console.warn("Failed to delete from localStorage:", error);
			throw error;
		}
	}

	private getKey(key: string): string {
		return `${this.prefix}${key}`;
	}
}
