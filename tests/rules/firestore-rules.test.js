/**
 * Firestore security-rules tests (PLACEHOLDER).
 *
 * --------------------------------------------------------------------------
 * Why is this skipped?
 * --------------------------------------------------------------------------
 * Real rules tests require @firebase/rules-unit-testing + the Firestore
 * emulator. Both add ~50MB of deps and a Java runtime, so we keep this file
 * as a runnable shell with `describe.skip` until we are ready to wire it up
 * in CI.
 *
 * --------------------------------------------------------------------------
 * How to enable (one-time setup):
 * --------------------------------------------------------------------------
 *   1. Install the rules-unit-testing helper:
 *        npm install --save-dev @firebase/rules-unit-testing
 *
 *   2. Make sure the Firebase emulator is available (already a dev-dep here
 *      via firebase-tools). Then start it before running this suite:
 *        npx firebase emulators:start --only firestore
 *
 *   3. Replace the line below with a real `package.json` script:
 *        "test:rules": "firebase emulators:exec --only firestore 'vitest run tests/rules'"
 *
 *   4. Switch `describe.skip(...)` to `describe(...)` and remove the early
 *      return below.
 *
 * --------------------------------------------------------------------------
 * Sample test scaffold (kept skipped on purpose):
 * --------------------------------------------------------------------------
 */

import { describe, it, expect } from 'vitest';

// TODO(test:rules): import once @firebase/rules-unit-testing is installed:
// import {
//   initializeTestEnvironment,
//   assertSucceeds,
//   assertFails,
// } from '@firebase/rules-unit-testing';
// import { readFileSync } from 'node:fs';

describe.skip('firestore.rules — placeholder until emulator is wired', () => {
  // let testEnv;
  //
  // beforeAll(async () => {
  //   testEnv = await initializeTestEnvironment({
  //     projectId: 'bayit-community-rules-test',
  //     firestore: {
  //       rules: readFileSync('firestore.rules', 'utf8'),
  //       host: '127.0.0.1',
  //       port: 8080,
  //     },
  //   });
  // });
  //
  // afterAll(async () => {
  //   await testEnv?.cleanup();
  // });
  //
  // afterEach(async () => {
  //   await testEnv?.clearFirestore();
  // });

  it('rejects unauthenticated reads of users/*', async () => {
    // const ctx = testEnv.unauthenticatedContext();
    // await assertFails(ctx.firestore().doc('users/abc').get());
    expect(true).toBe(true);
  });

  it('allows an admin to update other users', async () => {
    // const admin = testEnv.authenticatedContext('admin-uid', { admin: true });
    // await assertSucceeds(
    //   admin.firestore().doc('users/other').update({ status: 'active' })
    // );
    expect(true).toBe(true);
  });
});
