import type { Hex } from '../types/misc';

export type ErrorType<name extends string = 'Error'> = Error & { name: name };

export const getContractAddress = (address: Hex) => address;
export const getUrl = (url: string) => url;
