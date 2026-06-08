import assert from 'node:assert/strict';
import test from 'node:test';
import { fileState, negotiateManifests } from './negotiate';
import { SyncManifest } from '../types';

function manifest(files: ReturnType<typeof fileState>[]): SyncManifest {
  return { vault_id: 'test', generated_at: 1, files };
}

test('move/rename deletes old server path and uploads new path', () => {
  const hash = 'abc123';
  const decisions = negotiateManifests(
    manifest([fileState('folder/note.md', hash)]),
    manifest([fileState('note.md', hash)]),
    manifest([fileState('note.md', hash)])
  );

  const upload = decisions.find((d) => d.action === 'upload');
  const del = decisions.find((d) => d.action === 'delete');

  assert.equal(upload?.path, 'folder/note.md');
  assert.equal(del?.path, 'note.md');
});

test('local delete removes unchanged remote copy', () => {
  const hash = 'deadbeef';
  const decisions = negotiateManifests(
    manifest([]),
    manifest([fileState('gone.md', hash)]),
    manifest([fileState('gone.md', hash)])
  );

  assert.deepEqual(
    decisions.map((d) => d.action),
    ['delete']
  );
  assert.equal(decisions[0]?.path, 'gone.md');
});

test('remote-only file is downloaded when absent from base', () => {
  const hash = 'feedface';
  const decisions = negotiateManifests(
    manifest([]),
    manifest([fileState('new-remote.md', hash)]),
    manifest([])
  );

  assert.deepEqual(
    decisions.map((d) => d.action),
    ['download']
  );
  assert.equal(decisions[0]?.path, 'new-remote.md');
});

test('local delete with remote edit is a conflict', () => {
  const decisions = negotiateManifests(
    manifest([]),
    manifest([fileState('edited.md', 'remote-hash')]),
    manifest([fileState('edited.md', 'base-hash')])
  );

  assert.deepEqual(
    decisions.map((d) => d.action),
    ['conflict']
  );
});

test('remote delete removes unchanged local copy', () => {
  const hash = 'abc123';
  const decisions = negotiateManifests(
    manifest([fileState('gone.md', hash)]),
    manifest([]),
    manifest([fileState('gone.md', hash)])
  );

  assert.deepEqual(
    decisions.map((d) => d.action),
    ['delete_local']
  );
  assert.equal(decisions[0]?.path, 'gone.md');
});

test('remote delete with local edit is a conflict', () => {
  const decisions = negotiateManifests(
    manifest([fileState('edited.md', 'local-hash')]),
    manifest([]),
    manifest([fileState('edited.md', 'base-hash')])
  );

  assert.deepEqual(
    decisions.map((d) => d.action),
    ['conflict']
  );
});
