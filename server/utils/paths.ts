import { homedir } from 'node:os'
import { join } from 'node:path'

export function getProjectsDir(): string {
  const home = homedir() || process.env.USERPROFILE || process.env.HOME
  if (!home) {
    throw new Error('Could not resolve home directory (no os.homedir(), USERPROFILE or HOME)')
  }
  return join(home, '.claude', 'projects')
}
