import * as fs from 'fs'
import * as path from 'path'

const getChangelogEntry = (version: string): string => {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  if (!fs.existsSync(changelogPath)) {
    console.error(`Error: CHANGELOG.md not found at ${changelogPath}`)
    process.exit(1)
  }

  const changelogContent = fs.readFileSync(changelogPath, 'utf-8')
  const lines = changelogContent.split('\n')

  let recording = false
  const entryLines: string[] = []
  // Regex to match "## [version]" like "## [1.2.3]"
  // Need to escape dots in the version string for the regex
  const escapedVersion = version.replace(/\./g, '\\.')
  const versionHeaderPattern = new RegExp(`^## \\[${escapedVersion}\\]`)
  // Regex to match any "## [version]" like line, to stop recording
  const anyVersionHeaderPattern = /^##\s+\[.+?\]/

  for (const line of lines) {
    if (versionHeaderPattern.test(line)) {
      if (recording) {
        // This case should ideally not be hit if changelog is well-formed,
        // but if it is, we stop previous recording.
        break
      }
      recording = true
      continue // Start recording lines *after* the matching version header
    }

    if (recording) {
      if (anyVersionHeaderPattern.test(line)) {
        recording = false // Found the next version's header, so stop
        break
      }
      entryLines.push(line)
    }
  }

  // Trim leading and trailing empty lines from the collected notes
  let firstNonEmptyLine = -1
  let lastNonEmptyLine = -1

  for (let i = 0; i < entryLines.length; i++) {
    if (entryLines[i].trim() !== '') {
      firstNonEmptyLine = i
      break
    }
  }

  if (firstNonEmptyLine === -1) {
    // All lines were empty or no lines recorded
    return ''
  }

  for (let i = entryLines.length - 1; i >= firstNonEmptyLine; i--) {
    if (entryLines[i].trim() !== '') {
      lastNonEmptyLine = i
      break
    }
  }

  if (lastNonEmptyLine === -1) {
    // Should not happen if firstNonEmptyLine is not -1
    return ''
  }

  return entryLines.slice(firstNonEmptyLine, lastNonEmptyLine + 1).join('\n')
}

if (process.argv.length < 3) {
  console.error('Usage: npx ts-node scripts/getChangelog.ts <version_without_v_prefix>')
  process.exit(1)
}

const versionArg = process.argv[2]
if (!versionArg || versionArg.trim() === '') {
  console.error('Error: Version argument is missing or empty.')
  process.exit(1)
}

try {
  const changelogEntry = getChangelogEntry(versionArg)
  process.stdout.write(changelogEntry)
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error during changelog extraction: ${error.message}`)
  } else {
    console.error('An unknown error occurred during changelog extraction.')
  }
  process.exit(1)
}
