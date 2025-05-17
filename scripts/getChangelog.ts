import * as fs from 'fs'
import * as path from 'path'
import { parser, Changelog } from 'keep-a-changelog'

const getChangelogEntry = (version: string): string => {
  const changelogPath = path.join(process.cwd(), 'CHANGELOG.md')
  if (!fs.existsSync(changelogPath)) {
    console.error(`Error: CHANGELOG.md not found at ${changelogPath}`)
    process.exit(1)
  }

  try {
    const changelogContent = fs.readFileSync(changelogPath, 'utf-8')
    const parsedChangelog: Changelog = parser(changelogContent)

    const release = parsedChangelog.releases.find((r) => r.version === version)

    if (!release) {
      // If the version is not found, try to find it as "UNRELEASED" if "UNRELEASED" is passed
      if (version.toUpperCase() === 'UNRELEASED') {
        const unreleased = parsedChangelog.releases.find((r) => !r.version && !r.date) // Unreleased has no version and no date
        if (unreleased) {
          return unreleased.toString().split('\n').slice(1).join('\n').trim() // Return notes, skip header
        }
      }
      // Or if a specific version is requested that matches the description of an unreleased section
      const unreleasedSection = parsedChangelog.releases.find(
        (r) => !r.version && r.description === version
      )
      if (unreleasedSection) {
        return unreleasedSection.toString().split('\n').slice(1).join('\n').trim()
      }

      console.warn(`Warning: Version ${version} not found in CHANGELOG.md`)
      return ''
    }
    release.setDate(new Date())
    return release.toString()
  } catch (error) {
    if (error instanceof Error) {
      console.error(`Error parsing CHANGELOG.md: ${error.message}`)
    } else {
      console.error('An unknown error occurred while parsing CHANGELOG.md.')
    }
    process.exit(1)
  }
}

if (process.argv.length < 3) {
  console.error(
    'Usage: npx ts-node scripts/getChangelog.ts <version_without_v_prefix | UNRELEASED>'
  )
  process.exit(1)
}

const versionArg = process.argv[2]
if (!versionArg || versionArg.trim() === '') {
  console.error('Error: Version argument is missing or empty.')
  process.exit(1)
}

try {
  const changelogEntry = getChangelogEntry(versionArg)
  // Check if the result is empty and if so, don't print a trailing newline
  if (changelogEntry) {
    process.stdout.write(changelogEntry + '\n')
  } else if (versionArg.toUpperCase() !== 'UNRELEASED') {
    // Only print newline if entry was expected but not found (and not UNRELEASED)
    // For UNRELEASED, if it's empty, it means no unreleased changes, so print nothing.
    // If a specific version was requested and not found, it prints a warning and then an empty string.
    // If we want to ensure a newline for "not found" specific versions:
    // process.stdout.write('\n')
  }
} catch (error) {
  if (error instanceof Error) {
    console.error(`Error during changelog extraction: ${error.message}`)
  } else {
    console.error('An unknown error occurred during changelog extraction.')
  }
  process.exit(1)
}
