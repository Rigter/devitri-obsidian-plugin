/**
 * 3-way sync negotiation (pure logic, testable without Obsidian runtime).
 */

import {
  FileState,
  normalizeSyncManifest,
  SyncDecision,
  SyncManifest,
} from '../types';

export function negotiateManifests(
  localManifest: SyncManifest,
  remoteManifest: SyncManifest,
  baseManifest: SyncManifest
): SyncDecision[] {
  const decisions: SyncDecision[] = [];
  const local = normalizeSyncManifest(localManifest, localManifest.vault_id);
  const remote = normalizeSyncManifest(remoteManifest, local.vault_id);
  const base = normalizeSyncManifest(baseManifest, local.vault_id);
  const bMap = new Map(base.files.map((f) => [f.path, f]));
  const rMap = new Map(remote.files.map((f) => [f.path, f]));
  const localPaths = new Set(local.files.map((f) => f.path));

  for (const localFile of local.files) {
    const baseFile = bMap.get(localFile.path);
    const remoteFile = rMap.get(localFile.path);
    const HL = localFile.hash;
    const HB = baseFile?.hash ?? null;
    const HR = remoteFile?.hash ?? null;

    if (HB === null && HR === null) {
      decisions.push({ path: localFile.path, action: 'upload', local: localFile });
    } else if (HB !== null && HR !== null && HL === HB && HR === HB) {
      decisions.push({
        path: localFile.path,
        action: 'skip',
        local: localFile,
        base: baseFile,
        remote: remoteFile,
      });
    } else if (HB !== null && HL !== HB && HR === HB) {
      decisions.push({
        path: localFile.path,
        action: 'upload',
        local: localFile,
        base: baseFile,
        remote: remoteFile,
      });
    } else if (HB !== null && HR === null && HL === HB) {
      // Remote deleted (or moved away); local unchanged — drop local copy.
      decisions.push({
        path: localFile.path,
        action: 'delete_local',
        local: localFile,
        base: baseFile,
      });
    } else if (HB !== null && HR !== null && HR !== HB && HL === HB) {
      decisions.push({
        path: localFile.path,
        action: 'download',
        local: localFile,
        base: baseFile,
        remote: remoteFile,
      });
    } else if (HB !== null && HL !== HB && HR !== HB && HL !== HR) {
      decisions.push({
        path: localFile.path,
        action: 'conflict',
        local: localFile,
        base: baseFile,
        remote: remoteFile,
      });
    } else if (HB !== null && HL === HB && HR !== HB) {
      decisions.push({
        path: localFile.path,
        action: 'skip',
        local: localFile,
        base: baseFile,
        remote: remoteFile,
      });
    }
  }

  for (const remoteFile of remote.files) {
    if (localPaths.has(remoteFile.path)) {
      continue;
    }

    const baseFile = bMap.get(remoteFile.path);
    const HB = baseFile?.hash ?? null;
    const HR = remoteFile.hash;

    if (HB === null) {
      decisions.push({
        path: remoteFile.path,
        action: 'download',
        base: baseFile,
        remote: remoteFile,
      });
      continue;
    }

    if (HR === HB) {
      decisions.push({
        path: remoteFile.path,
        action: 'delete',
        base: baseFile,
        remote: remoteFile,
      });
      continue;
    }

    decisions.push({
      path: remoteFile.path,
      action: 'conflict',
      base: baseFile,
      remote: remoteFile,
    });
  }

  return decisions;
}

export function fileState(
  path: string,
  hash: string,
  modified_at = 1,
  size = 1
): FileState {
  return { path, hash, modified_at, size };
}
