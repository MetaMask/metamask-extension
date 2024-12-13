import browser from 'webextension-polyfill';
import { awaitOffscreenDocumentCreation } from '../../offscreen';
import {
  OffscreenCommunicationTarget,
} from '../../../../shared/constants/offscreen-communication';

const offscreenSupported = browser.offscreen;

const browserRuntimeSendMessageToAwait = async (params) => {
	await awaitOffscreenDocumentCreation();
	return new Promise((resolve, reject) => {
		browser.runtime.sendMessage(
			params,
			(response) => {
				if (response.error) {
					reject(response.error);
				}

				resolve(response.value);
			}
		);
	})
}

const localStorageWithOffscreen = {
	getItem: (key) => {
		if (offscreenSupported) {
			await awaitOffscreenDocumentCreation();
			return await browserRuntimeSendMessageToAwait({
			  target: OffscreenCommunicationTarget.localStorageOffscreen,
			  action: 'getItem',
			  key,
			});
		} else {
			return window.localStorage.getItem(key);
		}
	},
	setItem: (key, value) => {
		if (offscreenSupported) {
			await awaitOffscreenDocumentCreation();
			return await browserRuntimeSendMessageToAwait({
			  target: OffscreenCommunicationTarget.localStorageOffscreen,
			  action: 'setItem',
			  key,
			  value,
			});
		} else {
			return window.localStorage.setItem(key, value);
		}
	},
	removeItem: (key) => {
		if (offscreenSupported) {
			await awaitOffscreenDocumentCreation();
			return await browserRuntimeSendMessageToAwait({
			  target: OffscreenCommunicationTarget.localStorageOffscreen,
			  action: 'removeItem',
			  key,
			});
		} else {
			return window.localStorage.removeItem(key);
		}
	},
};