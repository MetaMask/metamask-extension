// currently only used in webpack build.

// Polyfill Reflect.metadata before SES lockdown runs to allow inversify to work
import 'reflect-metadata';
import 'ses';

// Ensure Reflect.decorate is present and log it
if (typeof Reflect.decorate !== 'function') {
  console.warn('Reflect.decorate not found after polyfill');
} else {
  console.log('Reflect.decorate loaded successfully');
}

// lockdown() is called in lockdown-run.js

export {};
