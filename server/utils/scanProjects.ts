import { readdir, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { getProjectsDir } from './paths'

export interface ScannedFile {
  filePath: string
  projectSlug: string
  /** Session this file belongs to. For subagent files this is the PARENT session's uuid. */
  sessionId: string
  /** True for <session>/subagents/*.jsonl transcripts, false for top-level <session>.jsonl files. */
  isSidechain: boolean
  mtimeMs: number
  size: number
}

/**
 * Walks ~/.claude/projects/<slug>/*.jsonl (conversations) and
 * ~/.claude/projects/<slug>/<sessionUuid>/subagents/*.jsonl (subagent transcripts).
 * Only stats files — never reads content. Missing projects dir yields an empty list.
 */
export async function scanProjects(): Promise<ScannedFile[]> {
  const projectsDir = getProjectsDir()
  const results: ScannedFile[] = []

  let projectEntries
  try {
    projectEntries = await readdir(projectsDir, { withFileTypes: true })
  } catch {
    return results
  }

  for (const projectEntry of projectEntries) {
    if (!projectEntry.isDirectory()) continue
    const projectSlug = projectEntry.name
    const slugPath = join(projectsDir, projectSlug)

    let slugEntries
    try {
      slugEntries = await readdir(slugPath, { withFileTypes: true })
    } catch {
      continue
    }

    for (const entry of slugEntries) {
      const entryPath = join(slugPath, entry.name)

      if (entry.isFile() && entry.name.endsWith('.jsonl')) {
        const sessionId = entry.name.slice(0, -'.jsonl'.length)
        const stats = await stat(entryPath).catch(() => null)
        if (!stats) continue
        results.push({
          filePath: entryPath,
          projectSlug,
          sessionId,
          isSidechain: false,
          mtimeMs: stats.mtimeMs,
          size: stats.size
        })
        continue
      }

      if (entry.isDirectory()) {
        const sessionId = entry.name
        const subagentsDir = join(entryPath, 'subagents')
        let subagentEntries
        try {
          subagentEntries = await readdir(subagentsDir, { withFileTypes: true })
        } catch {
          continue
        }

        for (const subEntry of subagentEntries) {
          if (!subEntry.isFile() || !subEntry.name.endsWith('.jsonl')) continue
          const subPath = join(subagentsDir, subEntry.name)
          const stats = await stat(subPath).catch(() => null)
          if (!stats) continue
          results.push({
            filePath: subPath,
            projectSlug,
            sessionId,
            isSidechain: true,
            mtimeMs: stats.mtimeMs,
            size: stats.size
          })
        }
      }
    }
  }

  return results
}
