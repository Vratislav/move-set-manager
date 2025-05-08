import { app } from 'electron'
import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'

export const DEFAULT_DB_FOLDER_NAME = 'move-manager-db'

export function getDbPath() {
  const userDataPath = app.getPath('home')
  return join(userDataPath, DEFAULT_DB_FOLDER_NAME)
}

export function createDbFolderIfNotExists() {
  const dbPath = getDbPath()
  if (!existsSync(dbPath)) {
    mkdirSync(dbPath, { recursive: true })
  }
}
