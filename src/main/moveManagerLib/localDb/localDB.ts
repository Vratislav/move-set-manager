import fs from 'fs'
import path from 'path'
import {
  CompleteSetMetadata,
  SetWithCompleteMetadata,
  MoveSet,
  ManagerSetMetadata
} from '../model/set'

import simpleGit, { CleanOptions, SimpleGit } from 'simple-git'
import { MoveDevice, MoveDevices } from '../model/device'
import { MovePage } from '../model/page'
import { UserSettings } from '../model/userSettings'

const SETS_DIR = 'sets'
const META_DIR = 'meta'
const PAGES_DIR = 'pages'
const DEVICES_FILE = 'devices.json'
const USER_SETTINGS_FILE = 'userSettings.json'
const SET_FOLDER_PLACEHOLDER = '_set'
const SET_SONG_FILE_PATH = path.join(SET_FOLDER_PLACEHOLDER, 'Song.abl')

// Define revision interfaces based on the requested format
interface SetRevisionAuthor {
  name: string
  email: string
}

interface SetRevision {
  commit: string
  abbreviated_commit: string
  author: SetRevisionAuthor
  date: string // ISO format date string
  timestamp: string // Unix timestamp as string
  message: string
  full_message: string
}

async function ensureLocalDbDirsExists(rootDir: string) {
  //Create rootDir if it does not exist
  const setsDir = path.join(rootDir, SETS_DIR)
  if (!fs.existsSync(rootDir)) {
    fs.mkdirSync(rootDir, { recursive: true })
  }

  //Create Sets dir if it does not exist
  if (!fs.existsSync(setsDir)) {
    fs.mkdirSync(setsDir, { recursive: true })
  }

  //Create Pages dir if it does not exist
  const pagesDir = path.join(rootDir, PAGES_DIR)
  if (!fs.existsSync(pagesDir)) {
    fs.mkdirSync(pagesDir, { recursive: true })
  }

  //Create Meta dir if it does not exist
  const metaDir = path.join(rootDir, META_DIR)
  if (!fs.existsSync(metaDir)) {
    fs.mkdirSync(metaDir, { recursive: true })
  }
  const git = simpleGit(rootDir)
  const gitignorePath = path.join(rootDir, '.gitignore')
  if (!fs.existsSync(gitignorePath)) {
    const gitignoreSrcPath = path.join('.', 'db.gitignore')
    console.log(`Copying ${gitignoreSrcPath} to ${gitignorePath}`)
    console.log('Initializing git repo')
    fs.copyFileSync(gitignoreSrcPath, gitignorePath)
    await git.init()
    await ensureGitConfigurationIsValid(git)
    await git.add('.gitignore')
    await git.commit('Initial commit')
  }
}

async function ensureGitConfigurationIsValid(git: SimpleGit) {
  //Check if name and email are set
  const name = await git.getConfig('user.name', 'global')
  const email = await git.getConfig('user.email', 'global')
  // If name is not set, set it to 'Move Manager'
  if (!name.value) {
    await git.addConfig('user.name', 'Move Manager', false, 'local')
    console.log('Set git user name to Move Manager')
  }
  // If email is not set, set it to 'movemanager@example.com'
  if (!email.value) {
    await git.addConfig('user.email', 'movemanager@example.com', false, 'local')
    console.log('Set git user email to movemanager@example.com')
  }
}

export async function initLocalDb(rootDirPath: string) {
  console.log('Initializing local db at:', rootDirPath)
  await ensureLocalDbDirsExists(rootDirPath)
}

export class LocalDb {
  public readonly rootDirPath: string
  public readonly setsDirPath: string
  public readonly metaDirPath: string
  private _isInited: boolean = false
  private readonly git: SimpleGit
  constructor(rootDir: string) {
    this.rootDirPath = rootDir
    this.setsDirPath = path.join(rootDir, SETS_DIR)
    this.metaDirPath = path.join(rootDir, META_DIR)
    if (!fs.existsSync(this.rootDirPath)) {
      fs.mkdirSync(this.rootDirPath, { recursive: true })
    }
    console.log('DB Root path:', this.rootDirPath)
    this.git = simpleGit(rootDir)
  }

  public async init() {
    if (!this._isInited) {
      await initLocalDb(this.rootDirPath)
      this._isInited = true
    }
  }

  public isInited(): boolean {
    return this._isInited
  }

  public async getUserSettings(): Promise<UserSettings | undefined> {
    const userSettingsPath = path.join(this.rootDirPath, USER_SETTINGS_FILE)
    if (!fs.existsSync(userSettingsPath)) {
      return undefined
    }
    const userSettings = await fs.promises.readFile(userSettingsPath, 'utf8')
    return JSON.parse(userSettings)
  }

  public async updateUserSettings(userSettings: UserSettings) {
    const userSettingsPath = path.join(this.rootDirPath, USER_SETTINGS_FILE)
    await fs.promises.writeFile(userSettingsPath, JSON.stringify(userSettings, null, 2))
  }

  public async getSet(setId: string): Promise<SetWithCompleteMetadata | undefined> {
    const setPath = path.join(this.setsDirPath, setId)
    //Check if folder exists at setPath
    if (!fs.existsSync(setPath)) {
      return undefined
    }
    //Check if meta file exists at setPath
    const metaPath = path.join(this.metaDirPath, `${setId}.json`)
    if (!fs.existsSync(metaPath)) {
      return undefined
    }
    //Read meta file
    const meta = await fs.promises.readFile(metaPath, 'utf8')

    this.git.show()

    //TODO: ZOD validation
    const metadata: CompleteSetMetadata = JSON.parse(meta)
    const set: SetWithCompleteMetadata = {
      managerMeta: metadata.managerMeta,
      meta: metadata.meta,
      path: setPath
    }
    return set
  }

  public async getSets(): Promise<SetWithCompleteMetadata[]> {
    const sets: SetWithCompleteMetadata[] = []
    try {
      const metaFiles = await fs.promises.readdir(this.metaDirPath)
      for (const metaFile of metaFiles) {
        if (path.extname(metaFile) === '.json') {
          const setId = path.basename(metaFile, '.json')
          const setPath = path.join(this.setsDirPath, setId)

          if (fs.existsSync(setPath)) {
            const metaPath = path.join(this.metaDirPath, metaFile)
            try {
              const metaContent = await fs.promises.readFile(metaPath, 'utf8')
              // TODO: ZOD validation
              const metadata: CompleteSetMetadata = JSON.parse(metaContent)
              const set: SetWithCompleteMetadata = {
                managerMeta: metadata.managerMeta,
                meta: metadata.meta,
                path: setPath
              }
              sets.push(set)
            } catch (err) {
              console.error(`Error reading or parsing metadata file ${metaPath}:`, err)
              // Optionally skip this set or handle error differently
            }
          } else {
            // Meta file exists but corresponding set directory does not.
            // Might indicate an inconsistent state. Log a warning?
            console.warn(
              `Metadata file found for set ${setId} but corresponding directory ${setPath} does not exist.`
            )
          }
        }
      }
    } catch (err) {
      console.error(`Error reading meta directory ${this.metaDirPath}:`, err)
      // Rethrow or return empty array depending on desired error handling
      throw err // Or return [];
    }
    return sets
  }

  public async startDbUpdate() {
    await this.git.reset(['--hard'])
    await this.git.clean(CleanOptions.FORCE)
  }

  public async commitDbUpdate(message: string) {
    await this.git.add('.')
    await this.git.commit(message)
  }

  public async rollbackDbUpdate() {
    await this.git.reset(['--hard'])
    await this.git.clean(CleanOptions.FORCE)
  }

  //Get a set version from a specific revision as a string
  public async getSetVersionFromRevision(setId: string, revision: string): Promise<string> {
    const filePath = path.join(SETS_DIR, setId, SET_SONG_FILE_PATH)
    // Use git show to get the content of the file at the specified revision
    // The format is <revision>:<path_from_repo_root>
    const fileContent = await this.git.show([`${revision}:${filePath}`])
    return fileContent
  }

  /**
   * Gets the revision history for a specific file within a set.
   * @param setId The ID of the set.
   * @param relativeFilePath The path of the file relative to the set directory (e.g., "_set/Song.abl").
   * @returns A promise that resolves to an array of SetRevision objects, ordered from newest to oldest.
   */
  public async getSetFileRevisions(setId: string): Promise<SetRevision[]> {
    // Construct path relative to the git repository root using the constant
    const fileLogPath = path.join(SETS_DIR, setId, SET_SONG_FILE_PATH)

    try {
      // Define the desired log format using git log format placeholders
      const logFormat = {
        commit: '%H', // Full commit hash
        abbreviated_commit: '%h', // Abbreviated commit hash
        author_name: '%an', // Author name
        author_email: '%ae', // Author email
        date: '%ai', // Author date, ISO 8601 format
        timestamp: '%at', // Author date, UNIX timestamp
        message: '%s', // Subject (first line of commit message)
        full_message: '%b' // Body of commit message
      }

      // Options for the git log command
      const logOptions = {
        format: logFormat, // Apply the custom format
        file: fileLogPath, // Specify the file to track
        '--follow': null, // Follow file history across renames
        '--all': null // Consider all branches/refs
        // simple-git typically handles adding '--' before the file path
      }

      // Execute git log with the specified options and custom format type
      const logResult = await this.git.log<typeof logFormat>(logOptions)

      // Map the raw log entries to the SetRevision interface
      const revisions: SetRevision[] = logResult.all.map((entry) => ({
        commit: entry.commit,
        abbreviated_commit: entry.abbreviated_commit,
        author: {
          name: entry.author_name,
          email: entry.author_email
        },
        date: entry.date, // Should be ISO 8601 format from %ai
        timestamp: entry.timestamp, // Should be Unix timestamp string from %at
        message: entry.message,
        full_message: entry.full_message.trim() // Trim potential whitespace/newlines
      }))

      return revisions
    } catch (error) {
      // Log errors encountered during the git operation
      console.error(`Error getting revisions for ${fileLogPath}:`, error)
      // Return an empty array or re-throw based on error handling strategy
      return []
    }
  }

  public async getDevices(): Promise<MoveDevices> {
    const devicesPath = path.join(this.rootDirPath, DEVICES_FILE)
    if (!fs.existsSync(devicesPath)) {
      return {}
    }
    const devices = await fs.promises.readFile(devicesPath, 'utf8')
    const devicesJson: MoveDevices = JSON.parse(devices)
    return devicesJson
  }

  public async getDevice(deviceId: string): Promise<MoveDevice | undefined> {
    const devices = await this.getDevices()
    const device = devices[deviceId]
    if (!device) {
      return undefined
    }
    return device
  }

  public async updateDevice(device: MoveDevice) {
    const devicesPath = path.join(this.rootDirPath, DEVICES_FILE)
    const devices = await this.getDevices()
    devices[device.id] = device
    await fs.promises.writeFile(devicesPath, JSON.stringify(devices, null, 2))
  }

  public async updatePage(page: MovePage) {
    const pagesPath = path.join(this.rootDirPath, PAGES_DIR, `${page.id}.json`)
    console.log('Updating page', page.id, 'at path', pagesPath)
    await fs.promises.writeFile(pagesPath, JSON.stringify(page, null, 2))
    console.log('Page updated')
  }

  public async deletePage(pageId: string) {
    const pagesPath = path.join(this.rootDirPath, PAGES_DIR, `${pageId}.json`)
    if (!fs.existsSync(pagesPath)) {
      return
    }
    await fs.promises.unlink(pagesPath)
  }

  public async getPage(pageId: string): Promise<MovePage | undefined> {
    const pagesPath = path.join(this.rootDirPath, PAGES_DIR, `${pageId}.json`)
    if (!fs.existsSync(pagesPath)) {
      return undefined
    }
    const page = await fs.promises.readFile(pagesPath, 'utf8')
    return JSON.parse(page)
  }

  public async getPages(): Promise<MovePage[]> {
    const pagesPath = path.join(this.rootDirPath, PAGES_DIR)
    const pages = await fs.promises.readdir(pagesPath)
    //filter out non-json files
    const jsonPages = pages.filter((page) => page.endsWith('.json'))
    return jsonPages.map((page) => {
      const contents = fs.readFileSync(path.join(pagesPath, page), 'utf8')
      return JSON.parse(contents) as MovePage
    })
  }

  public async updateSetMetadata(metadata: CompleteSetMetadata) {
    const metaPath = path.join(this.metaDirPath, `${metadata.setId}.json`)
    await fs.promises.writeFile(metaPath, JSON.stringify(metadata, null, 2))
  }

  public async saveSet(
    set: MoveSet,
    deviceId: string,
    storeFn: (setDirPath: string) => Promise<void>
  ) {
    const existingSet = await this.getSet(set.meta.id)
    let managerMeta: ManagerSetMetadata = { moveDeviceId: 'UNKNOWN' }
    if (existingSet) {
      managerMeta = existingSet.managerMeta
      fs.rmSync(existingSet.path, { recursive: true })
    }

    managerMeta = { ...managerMeta, moveDeviceId: deviceId }

    await storeFn(this.setsDirPath)
    // Find the set directory and rename it to "_set"
    const setDirPath = path.join(this.setsDirPath, set.meta.id)

    // Check if there's a folder with the set's name that needs to be renamed
    const files = fs.readdirSync(setDirPath)
    for (const file of files) {
      const filePath = path.join(setDirPath, file)
      const newFilePath = path.join(setDirPath, SET_FOLDER_PLACEHOLDER)
      const stats = fs.statSync(filePath)

      if (stats.isDirectory() && file === set.meta.name && file !== set.meta.id) {
        // Found a directory with the set's name, rename it to the set's ID
        fs.renameSync(filePath, newFilePath)
        break
      }
    }
    await this.storeMetadata({
      setId: set.meta.id,
      managerMeta: managerMeta,
      meta: set.meta
    })
  }

  private async storeMetadata(completeSetMetadata: CompleteSetMetadata) {
    const metaPath = path.join(this.metaDirPath, `${completeSetMetadata.setId}.json`)
    await fs.promises.writeFile(metaPath, JSON.stringify(completeSetMetadata, null, 2))
  }
}
