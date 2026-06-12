/** True when `path` is the vault config dir or nested inside it. */
export function isUnderConfigDir(path: string, configDir: string): boolean {
  return path === configDir || path.startsWith(`${configDir}/`);
}
