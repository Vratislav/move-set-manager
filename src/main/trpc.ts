import { initTRPC } from '@trpc/server'
import { IMoveManager } from './moveManagerLib/moveManager/IMoveManager'
//import { CreateContextOptions } from 'electron-trpc/main'
import { LocalDb } from './moveManagerLib/localDb/localDB'
import { MoveManager } from './moveManagerLib/moveManager/MoveManager'
import { IMoveSSHClient, MoveSSHClient } from './moveManagerLib/moveClient/MoveSSHClient'
import path from 'path'
import { getDbPath } from './dbManagement'

export type RouterContext = {
  moveManager: IMoveManager
  sshClient: IMoveSSHClient
}

const ssh = new MoveSSHClient({
  host: 'move.local',
  port: 22,
  username: 'ableton',
  privKeyPath: path.join(process.env.HOME!, '.ssh/ableton')
})

const moveManager = new MoveManager(new LocalDb(getDbPath()), ssh)

export const createContext = async (): Promise<RouterContext> => {
  return {
    moveManager: moveManager,
    sshClient: ssh
  }
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createContext>().create({ isServer: true })

export const loggedProcedure = t.procedure.use(async (opts) => {
  const start = Date.now()

  const result = await opts.next()

  const durationMs = Date.now() - start
  const meta = { path: opts.path, type: opts.type, durationMs }

  result.ok ? console.log('OK request:', meta) : console.error('NOK request:', meta)
  if (!result.ok) {
    console.error('Error:', result.error)
  }
  return result
})

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const procedure = loggedProcedure
