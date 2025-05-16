import { SetColorOutOfRangeError, SetIndexOutOfRangeError, SetIndexTakenError } from '../errors'
import { LocalDb } from '../localDb/localDB'
import { MoveSSHClient } from '../moveClient/MoveSSHClient'
import {
  refreshTestDataInContainer,
  startMockAbletonMoveServer,
  TEST_SET_ID,
  wipeTestDb
} from '../testUtils'
import { MoveManager } from './MoveManager'

beforeAll(async () => {
  await startMockAbletonMoveServer()
}, 20000)

let moveManager: MoveManager
let ssh: MoveSSHClient

beforeEach(async () => {
  const testDbPath = './testDb'
  wipeTestDb(testDbPath)
  const localDb = new LocalDb(testDbPath)
  ssh = new MoveSSHClient({
    host: 'localhost',
    port: 2222,
    username: 'ableton',
    privKeyPath: './test.key'
  })
  moveManager = new MoveManager(localDb, ssh)
})

describe('MoveManager', () => {
  it('should download all sets', async () => {
    await moveManager.downloadAllSets()
    const allSets = await moveManager.getAllSets()
    expect(allSets.length).toBeGreaterThan(0)
    //Find the testing set
    const testingSet = allSets.find((set) => set.meta.id === TEST_SET_ID)
    expect(testingSet).not.toBeUndefined()
    expect(testingSet?.meta.name).toBe('TestSet')
    expect(testingSet?.meta.index).toBe(2)
    expect(testingSet?.meta.color).toBe(2)
  })

  it('should get all sets', async () => {
    await moveManager.downloadAllSets()
    const sets = await moveManager.getAllSets()
    expect(sets.length).toBeGreaterThan(0)
    //Find the testing set
    const testingSet = sets.find((set) => set.meta.id === TEST_SET_ID)
    expect(testingSet).not.toBeUndefined()
    expect(testingSet?.meta.name).toBe('TestSet')
    expect(testingSet?.meta.index).toBe(2)
    expect(testingSet?.meta.color).toBe(2)
  })

  describe('getPages / getPage', () => {
    it('should create a default page that is full with sets', async () => {
      await ssh.connect()
      const macAddress = await ssh.getMACAddress()
      await ssh.disconnect()
      const sets = await moveManager.downloadAllSets()
      const setsLength = sets.length
      const page = await moveManager.getPage(
        `default-${macAddress?.replace(/:/g, '-').toLowerCase()}`
      )
      expect(page).not.toBeUndefined()
      expect(page?.sets.length).toBe(setsLength)
    })

    it('should get all pages', async () => {
      await ssh.connect()
      const macAddress = await ssh.getMACAddress()
      await ssh.disconnect()
      const sets = await moveManager.downloadAllSets()
      const pages = await moveManager.getAllPages()
      expect(pages.length).toBeGreaterThan(0)
      const pageId = `default-${macAddress?.replace(/:/g, '-').toLowerCase()}`
      const defaultPage = pages.find((page) => page.id === pageId)
      expect(defaultPage).not.toBeUndefined()
      expect(defaultPage?.sets.length).toBe(sets.length)
    })
  })

  describe('wipeAllSetsOnDevice', () => {
    it('should wipe all sets on the device', async () => {
      await moveManager.wipeAllSetsOnDevice()
      const sets = await moveManager.downloadAllSets()
      expect(sets.length).toBe(0)
    })
  })

  describe('uploadSet', () => {
    beforeEach(async () => {
      await refreshTestDataInContainer()
    }, 20000)

    it('should upload a set', async () => {
      await moveManager.downloadAllSets()
      await moveManager.wipeAllSetsOnDevice()
      await moveManager.uploadSet(TEST_SET_ID)
      const sets = await moveManager.downloadAllSets()
      expect(sets.length).toBe(1)
      expect(sets[0].meta.id).toEqual(TEST_SET_ID)
      expect(sets[0].meta.name).toEqual('TestSet')
      expect(sets[0].meta.index).toEqual(2)
      expect(sets[0].meta.color).toEqual(2)
      expect(sets[0].meta.wasExternallyModified).toEqual(false)
      expect(sets[0].meta.localCloudState).toEqual('notSynced')
      expect(sets[0].meta.lastModifiedTime).toEqual('2025-04-18T15:00:24Z')
    })

    it('should not upload a set if the given set index is taken. Also throws if index or color is out of range', async () => {
      await moveManager.downloadAllSets()
      await moveManager.wipeAllSetsOnDevice()
      await moveManager.uploadSet(TEST_SET_ID)
      await expect(async () => {
        await moveManager.uploadSet(TEST_SET_ID)
      }).rejects.toThrow(SetIndexTakenError)
      await expect(async () => {
        await moveManager.uploadSet(TEST_SET_ID, undefined, 32)
      }).rejects.toThrow(SetIndexOutOfRangeError)
      await expect(async () => {
        await moveManager.uploadSet(TEST_SET_ID, undefined, -1)
      }).rejects.toThrow(SetIndexOutOfRangeError)
      await expect(async () => {
        await moveManager.uploadSet(TEST_SET_ID, undefined, undefined, 27)
      }).rejects.toThrow(SetColorOutOfRangeError)
      await expect(async () => {
        await moveManager.uploadSet(TEST_SET_ID, undefined, undefined, -1)
      }).rejects.toThrow(SetColorOutOfRangeError)
    })
  })

  //   describe("uploadPage", () => {
  //     beforeEach(async () => {
  //       await refreshTestDataInContainer();
  //     }, 20000);

  //     it("should upload a page", async () => {
  //       await moveManager.uploadPage(TEST_SET_ID, 1);
  //     });
  //   });
})
