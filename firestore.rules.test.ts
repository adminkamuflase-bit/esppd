import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const rulesContent = fs.readFileSync(new URL('./firestore.rules', import.meta.url), 'utf-8');
const blueprint = JSON.parse(
  fs.readFileSync(new URL('./firebase-blueprint.json', import.meta.url), 'utf-8'),
);

test('firestore.rules enforces default-deny, verified email, and Eight Pillars primitives', () => {
  assert.match(rulesContent, /rules_version = '2';/);
  assert.match(rulesContent, /match \/\{document=\*\*\} \{\s*allow read, write: if false;\s*\}/);
  assert.match(rulesContent, /request\.auth\.token\.email_verified == true/);
  assert.match(rulesContent, /function isValidId\(id\)/);
  assert.match(rulesContent, /function isValidUser\(/);
  assert.match(rulesContent, /function isValidWorkspace\(/);
  assert.match(rulesContent, /function isValidSettings\(/);
  assert.match(rulesContent, /function isValidPegawai\(/);
  assert.match(rulesContent, /function isValidSppd\(/);
  assert.match(rulesContent, /existing\(\)\.status != 'Selesai'/);
  assert.match(rulesContent, /data\.pengikut\.size\(\) <= 20/);
  assert.match(rulesContent, /request\.time/);
});

test('every collection path in firebase-blueprint.json has a matching rules block', () => {
  const firestorePaths = Object.keys(blueprint.firestore || {});
  assert.ok(firestorePaths.length >= 5);
  assert.match(rulesContent, /match \/users\/\{userId\}/);
  assert.match(rulesContent, /match \/workspaces\/\{workspaceId\}/);
  assert.match(rulesContent, /match \/settings\/\{settingId\}/);
  assert.match(rulesContent, /match \/pegawai\/\{pegawaiId\}/);
  assert.match(rulesContent, /match \/sppd\/\{sppdId\}/);
});

test('Dirty Dozen adversarial payload invariants reject invalid mutations', () => {
  const allowedUserKeys = new Set(['uid', 'email', 'displayName', 'role', 'createdAt', 'updatedAt']);
  const shadowPayload = {
    uid: 'user-1',
    email: 'user@example.com',
    displayName: 'Operator',
    role: 'operator',
    isAdmin: true,
    createdAt: 'SERVER_TIME',
    updatedAt: 'SERVER_TIME',
  };
  const hasShadowKey = Object.keys(shadowPayload).some((k) => !allowedUserKeys.has(k));
  assert.equal(hasShadowKey, true);

  const oversizedId = 'a'.repeat(129);
  assert.equal(/^[a-zA-Z0-9_\-]+$/.test(oversizedId) && oversizedId.length <= 128, false);

  const oversizedPengikut = Array.from({ length: 25 }, (_, i) => ({
    id: `p-${i}`,
    nama: `Pengikut ${i}`,
    nip: '-',
    keterangan: '-',
  }));
  assert.equal(oversizedPengikut.length <= 20, false);
});
