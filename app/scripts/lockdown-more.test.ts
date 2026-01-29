/**
 * Tests for lockdown-more.js to ensure that global intrinsics are properly
 * hardened without breaking their functionality.
 *
 * This test file verifies that critical static methods and properties on
 * global intrinsics (like Array.isArray) remain functional after the
 * lockdown-more.js script executes.
 */

import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('lockdown-more', () => {
  let dom: JSDOM;
  let window: Window & typeof globalThis;
  let originalArray: typeof Array;
  let originalObject: typeof Object;
  let originalString: typeof String;

  beforeEach(() => {
    // Create a fresh DOM environment for each test
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      runScripts: 'dangerously',
      url: 'http://localhost',
    });
    window = dom.window as unknown as Window & typeof globalThis;

    // Store original constructors for comparison
    originalArray = window.Array;
    originalObject = window.Object;
    originalString = window.String;

    // Add required globals for lockdown-more.js
    window.console = {
      ...console,
      warn: jest.fn(),
      error: jest.fn(),
    } as unknown as Console;

    // Mock sentry if needed
    (window as any).sentry = {
      captureException: jest.fn(),
    };

    // Add Compartment and harden mocks (normally provided by SES lockdown)
    (window as any).Compartment = class Compartment {
      globalThis = window;
    };
    (window as any).harden = (obj: any) => Object.freeze(obj);
  });

  afterEach(() => {
    dom.window.close();
  });

  describe('Array intrinsic hardening', () => {
    it('should preserve Array.isArray functionality after hardening', () => {
      // Load and execute lockdown-more.js in the test environment
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      // Execute the lockdown-more script
      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Array.isArray still works
      expect(typeof window.Array.isArray).toBe('function');
      expect(window.Array.isArray([])).toBe(true);
      expect(window.Array.isArray({})).toBe(false);
      expect(window.Array.isArray(null)).toBe(false);
      expect(window.Array.isArray(undefined)).toBe(false);
    });

    it('should preserve Array.from functionality after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Array.from still works
      expect(typeof window.Array.from).toBe('function');
      const result = window.Array.from([1, 2, 3]);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should preserve Array.of functionality after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Array.of still works
      expect(typeof window.Array.of).toBe('function');
      const result = window.Array.of(1, 2, 3);
      expect(result).toEqual([1, 2, 3]);
    });

    it('should make Array constructor non-configurable and non-writable', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Array is properly hardened
      const descriptor = Object.getOwnPropertyDescriptor(window, 'Array');
      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(false);
      expect(descriptor?.writable).toBe(false);

      // Verify the value is still the Array constructor
      expect(descriptor?.value).toBe(originalArray);
    });
  });

  describe('Object intrinsic hardening', () => {
    it('should preserve Object.keys functionality after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Object.keys still works
      expect(typeof window.Object.keys).toBe('function');
      const result = window.Object.keys({ a: 1, b: 2 });
      expect(result).toEqual(['a', 'b']);
    });

    it('should preserve Object.defineProperty functionality after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Object.defineProperty still works
      expect(typeof window.Object.defineProperty).toBe('function');
      const obj = {};
      window.Object.defineProperty(obj, 'test', { value: 42 });
      expect((obj as any).test).toBe(42);
    });

    it('should make Object constructor non-configurable and non-writable', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify Object is properly hardened
      const descriptor = Object.getOwnPropertyDescriptor(window, 'Object');
      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(false);
      expect(descriptor?.writable).toBe(false);

      // Verify the value is still the Object constructor
      expect(descriptor?.value).toBe(originalObject);
    });
  });

  describe('String intrinsic hardening', () => {
    it('should preserve String.fromCharCode functionality after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify String.fromCharCode still works
      expect(typeof window.String.fromCharCode).toBe('function');
      const result = window.String.fromCharCode(65, 66, 67);
      expect(result).toBe('ABC');
    });

    it('should make String constructor non-configurable and non-writable', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify String is properly hardened
      const descriptor = Object.getOwnPropertyDescriptor(window, 'String');
      expect(descriptor).toBeDefined();
      expect(descriptor?.configurable).toBe(false);
      expect(descriptor?.writable).toBe(false);

      // Verify the value is still the String constructor
      expect(descriptor?.value).toBe(originalString);
    });
  });

  describe('Error handling', () => {
    it('should log errors to console.error when hardening fails', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      // Break the harden function to trigger error
      (window as any).harden = () => {
        throw new Error('Test error');
      };

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify error was logged
      expect(window.console.error).toHaveBeenCalledWith(
        'Protecting intrinsics failed:',
        expect.any(Error),
      );
    });

    it('should handle LavaMoat scuttling errors gracefully', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      // Make harden throw a LavaMoat scuttling error for 'eval'
      (window as any).harden = (obj: any) => {
        if (obj === window.eval) {
          throw new Error(
            'LavaMoat - property "eval" of globalThis is inaccessible under scuttling mode',
          );
        }
        return Object.freeze(obj);
      };

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Verify warning was logged for scuttled property
      expect(window.console.warn).toHaveBeenCalledWith(
        'Property eval will not be hardened',
        'because it is scuttled by LavaMoat protection.',
        'Visit https://github.com/LavaMoat/LavaMoat/pull/360 to learn more.',
      );
    });
  });

  describe('Integration with Immer', () => {
    it('should allow Immer to use Array.isArray after hardening', () => {
      const lockdownMorePath = path.join(__dirname, 'lockdown-more.js');
      const lockdownMoreCode = fs.readFileSync(lockdownMorePath, 'utf8');

      const script = new window.Function(lockdownMoreCode);
      script.call(window);

      // Simulate what Immer does internally
      const testArray = [1, 2, 3];
      const testObject = { a: 1 };

      // Immer heavily relies on Array.isArray
      expect(window.Array.isArray(testArray)).toBe(true);
      expect(window.Array.isArray(testObject)).toBe(false);

      // Verify we can still create new arrays
      const newArray = new window.Array(1, 2, 3);
      expect(window.Array.isArray(newArray)).toBe(true);
      expect(newArray).toEqual([1, 2, 3]);
    });
  });
});
