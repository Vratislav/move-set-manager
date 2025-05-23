import path from 'path'
import { LocalDb } from '../src/localDb/localDB'
import { MoveSSHClient } from '../src/moveClient/MoveSSHClient'
import { MoveManager } from '../src/moveManager/MoveManager'

const PROD_DB_PATH = './db'

async function main() {
  const localDb = new LocalDb(PROD_DB_PATH)
  const ssh = new MoveSSHClient({
    host: 'move.local',
    port: 22,
    username: 'ableton',
    privKeyPath: path.join(process.env.HOME!, '.ssh/ableton')
  })
  const moveManager = new MoveManager(localDb, ssh)
  console.log('Loading all sets')
  const sets = await moveManager.getAllSets()
  console.log(`Found ${sets.length} sets`)
  console.log(`Looking for set with id ae1d302c-4105-42bb-a51b-c4934752a27f`)
  const set = sets.find((s) => s.meta.id === 'ae1d302c-4105-42bb-a51b-c4934752a27f')
  if (!set) {
    throw new Error('Set with id ae1d302c-4105-42bb-a51b-c4934752a27f not found')
  }
  console.log('Uploading set...')
  await moveManager.uploadSet('ae1d302c-4105-42bb-a51b-c4934752a27f')

  console.log('Done!')
}

main()
