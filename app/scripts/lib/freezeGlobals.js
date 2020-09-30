import 'ses';

if (
  process.env.IN_TEST !== 'true' &&
  process.env.METAMASK_ENV !== 'test'
) {
  lockdown();
}

