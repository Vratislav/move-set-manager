import { MoveDevice } from '../model/device'
import { MovePage } from '../model/page'
import { MoveSet, MoveSetInPage } from '../model/set'
import { UserSettings } from '../model/userSettings'

export interface IMoveManager {
  uploadSet(setId: string, name?: string, index?: number, color?: number): Promise<void>
  uploadPage(pageId: string): Promise<void>
  wipeAllSetsOnDevice(): Promise<void>
  downloadAllSets(): Promise<MoveSet[] | undefined>
  getAllSets(): Promise<MoveSet[]>
  getAllPages(): Promise<MovePage[]>
  getAllDevices(): Promise<MoveDevice[]>
  getPage(pageId: string): Promise<MovePage | undefined>
  createPage(page: MovePage, deviceId: string | undefined): Promise<void>
  updatePage(page: MovePage): Promise<void>
  updateSetInPage(page: MovePage, set: MoveSetInPage, setName: string): Promise<MovePage>
  setActivePage(pageId: string, deviceId: string): Promise<void>
  getUserSettings(): Promise<UserSettings | undefined>
  updateUserSettings(userSettings: UserSettings): Promise<void>
}
