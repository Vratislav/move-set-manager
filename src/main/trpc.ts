import { initTRPC } from '@trpc/server'
import { IMoveManager } from './moveManagerLib/moveManager/IMoveManager'
import { CreateContextOptions } from 'electron-trpc/main'
import { LocalDb } from './moveManagerLib/localDb/localDB'
import { MoveManager } from './moveManagerLib/moveManager/MoveManager'
import { IMoveSSHClient, MoveSSHClient } from './moveManagerLib/moveClient/MoveSSHClient'
import path from 'path'

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

const moveManager = new MoveManager(new LocalDb('./db'), ssh)

export const createContext = async (opts: CreateContextOptions): Promise<RouterContext> => {
  return {
    moveManager: moveManager as any,
    sshClient: ssh
  }
}

/**
 * Initialization of tRPC backend
 * Should be done only once per backend!
 */
const t = initTRPC.context<typeof createContext>().create({ isServer: true })

/**
 * Export reusable router and procedure helpers
 * that can be used throughout the router
 */
export const router = t.router
export const procedure = t.procedure
