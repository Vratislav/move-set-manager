import { SetColorOutOfRangeError, SetIndexOutOfRangeError, SetIndexTakenError } from '../errors'
import { initLocalDb, LocalDb } from '../localDb/localDB'
import { MoveDevice } from '../model/device'
import { MovePage } from '../model/page'
import { MoveSet } from '../model/set'
import { UserSettings } from '../model/userSettings'
import { MoveSSHClient } from '../moveClient/MoveSSHClient'
import { IMoveManager } from './IMoveManager'

export class MoveManager implements IMoveManager {
  private readonly localDb: LocalDb
  private readonly ssh: MoveSSHClient
  private isPerformingOperation = false

  constructor(localDb: LocalDb, ssh: MoveSSHClient) {
    this.localDb = localDb
    this.ssh = ssh
  }

  private async begin() {
    this.isPerformingOperation = true
    await this.localDb.init()
    await this.ssh.connect()
  }

  private async end() {
    if (this.isPerformingOperation) {
      this.isPerformingOperation = false
      await this.ssh.disconnect()
    }
  }

  private getDefaultPageName(moveMacAddress: string) {
    return `default-${moveMacAddress.replace(/:/g, '-')}`
  }

  private async _uploadSet(
    setId: string,
    name: string | undefined,
    index: number | undefined,
    color: number | undefined,
    setsOnDevice: MoveSet[] | undefined
  ) {
    const set = await this.localDb.getSet(setId)
    if (!set) {
      throw new Error(`Set ${setId} not found`)
    }
    if (index === undefined) {
      index = set.meta.index
    }
    if (index > 31 || index < 0) {
      throw new SetIndexOutOfRangeError(`Index ${index} is out of range`)
    }
    if (color === undefined) {
      color = set.meta.color
    }
    if (color < 0 || color > 26) {
      throw new SetColorOutOfRangeError(`Color ${color} is out of range`)
    }
    if (setsOnDevice === undefined) {
      setsOnDevice = await this.ssh.listSets()
    }
    if (name === undefined) {
      name = set.meta.name
    }
    const setOnDevice = setsOnDevice.find((s) => s.meta.index === index)
    if (setOnDevice) {
      throw new SetIndexTakenError(`Index ${index} is already occupied by ${setOnDevice.meta.name}`)
    }
    const uploadedSet = await this.ssh.uploadSet({
      ...set,
      meta: {
        ...set.meta,
        name,
        index,
        color
      }
    })
    setsOnDevice.push(uploadedSet)
  }

  public async uploadSet(setId: string, name?: string, index?: number, color?: number) {
    try {
      await this.begin()
      await this._uploadSet(setId, name, index, color, undefined)
    } finally {
      await this.end()
    }
  }

  public async uploadPage(pageId: string) {
    try {
      await this.begin()
      const page = await this.localDb.getPage(pageId)
      if (!page) {
        throw new Error(`Page ${pageId} not found`)
      }
      //Check that every index in the page is unique
      const indices = new Set()
      for (const setInPage of page.sets) {
        if (indices.has(setInPage.index)) {
          throw new Error(`Index ${setInPage.index} is already occupied`)
        }
        indices.add(setInPage.index)
      }
      await this._wipeAllSetsOnDevice()
      const setsOnDevice = await this.ssh.listSets()
      for (const setInPage of page.sets) {
        await this._uploadSet(
          setInPage.id,
          setInPage.alias,
          setInPage.index,
          setInPage.color,
          setsOnDevice
        )
      }
    } finally {
      await this.end()
    }
  }

  public async wipeAllSetsOnDevice() {
    try {
      await this.begin()
      await this._wipeAllSetsOnDevice()
    } finally {
      await this.end()
    }
  }

  private async _wipeAllSetsOnDevice() {
    const sets = await this.ssh.listSets()
    for (const set of sets) {
      await this.ssh.deleteSet(set.meta.id)
    }
  }

  public async downloadAllSets() {
    try {
      await this.begin()
      await this.localDb.startDbUpdate()
      const moveMacAddress = (await this.ssh.getMACAddress()) || 'UNKNOWN'
      let moveDevice = await this.localDb.getDevice(moveMacAddress)
      console.log(`moveDevice: ${moveDevice?.id}`)
      let page: MovePage | undefined
      if (!moveDevice) {
        page = {
          id: this.getDefaultPageName(moveMacAddress),
          name: 'Default',
          sets: []
        }
        moveDevice = {
          id: moveMacAddress,
          name: 'Ableton Move Device',
          currentPageId: page.id
        }
        console.log(`Adding new Move device: ${moveDevice.name} with default page ${page.id}`)
        await this.localDb.updateDevice(moveDevice)
        await this.localDb.commitDbUpdate(`New Move device: ${moveMacAddress}`)
      } else {
        page = await this.localDb.getPage(moveDevice.currentPageId)
        if (!page) {
          page = {
            id: this.getDefaultPageName(moveMacAddress),
            name: 'Default',
            sets: []
          }
        }
      }
      const sets = await this.ssh.listSets()
      page.sets = []
      for (const set of sets) {
        await this.localDb.saveSet(set, moveMacAddress, async (setDirPath) => {
          await this.ssh.downloadSet(set.meta.id, setDirPath)
        })
        page.sets.push({
          id: set.meta.id,
          index: set.meta.index,
          color: set.meta.color
        })
      }
      await this.localDb.updatePage(page)
      await this.localDb.commitDbUpdate(`Downloaded current sets from ${moveMacAddress}`)
      return sets
    } catch (e) {
      throw e
    } finally {
      await this.end()
    }
  }

  public async getAllDevices(): Promise<MoveDevice[]> {
    await this.localDb.init()
    const devices = await this.localDb.getDevices()
    return Object.values(devices)
  }

  public async getAllSets() {
    await this.localDb.init()
    const sets = await this.localDb.getSets()
    return sets
  }

  public async getAllPages() {
    await this.localDb.init()
    const pages = await this.localDb.getPages()
    return pages
  }

  public async getPage(pageId: string) {
    await this.localDb.init()
    const page = await this.localDb.getPage(pageId)
    return page
  }

  public async createPage(page: MovePage, deviceId: string | undefined) {
    await this.localDb.init()
    await this.localDb.updatePage(page)
    if (deviceId) {
      const device = await this.localDb.getDevice(deviceId)
      if (!device) {
        throw new Error(`Device ${deviceId} not found`)
      }
      device.currentPageId = page.id
      await this.localDb.updateDevice(device)
    }
    await this.localDb.commitDbUpdate(`Created page: ${page.name} (${page.id})`)
  }

  public async updatePage(page: MovePage) {
    await this.localDb.init()
    await this.localDb.updatePage(page)
    await this.localDb.commitDbUpdate(`Updated page: ${page.name} (${page.id})`)
  }

  public async setActivePage(pageId: string, deviceId: string) {
    await this.localDb.init()
    const page = await this.localDb.getPage(pageId)
    if (!page) {
      throw new Error(`Page ${pageId} not found`)
    }
    const device = await this.localDb.getDevice(deviceId)
    if (!device) {
      throw new Error(`Device ${deviceId} not found`)
    }
    device.currentPageId = pageId
    await this.localDb.updateDevice(device)
    await this.localDb.commitDbUpdate(
      `Set active page to ${page.name} on device ${device.name} (${pageId}  -> ${deviceId})`
    )
  }

  public async getUserSettings(): Promise<UserSettings | undefined> {
    await this.localDb.init()
    return await this.localDb.getUserSettings()
  }

  public async updateUserSettings(userSettings: UserSettings) {
    await this.localDb.init()
    await this.localDb.updateUserSettings(userSettings)
    this.ssh.updateConnectionOpts({
      ...this.ssh.getConnectionOpts(),
      privKeyPath: userSettings.sshPrivateKeyPath,
      host: userSettings.sshCustomHostname,
      port: userSettings.sshCustomPort,
      username: userSettings.sshCustomUsername
    })
    await this.localDb.commitDbUpdate(`Updated user settings`)
  }
}
