import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'
import { exposeElectronTRPC } from 'electron-trpc/main'
import fs from 'fs'
import path from 'path'

// Read package.json to get the app version
// Adjust the path according to your project structure if necessary
// __dirname in preload script refers to `out/preload`
const packageJsonPath = path.join(__dirname, '..', '..', 'package.json')
let appVersion = 'unknown'
try {
  const packageJsonContent = fs.readFileSync(packageJsonPath, 'utf-8')
  const packageJson = JSON.parse(packageJsonContent)
  appVersion = packageJson.version
} catch (error) {
  console.error('Failed to read app version from package.json:', error)
}

// Custom APIs for renderer
const api = {}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
    contextBridge.exposeInMainWorld('appVersion', appVersion)
    exposeElectronTRPC()
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
  // @ts-ignore (define in dts)
  window.appVersion = appVersion
}
