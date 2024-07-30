export const USER_STORAGE_VERSION = '1';

// Force cast. We don't really care about the type here since we treat it as a unique symbol
export const USER_STORAGE_VERSION_KEY: unique symbol = 'v' as never;
