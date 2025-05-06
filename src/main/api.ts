import { procedure, router } from './trpc'
import { IMoveManager } from './moveManagerLib/moveManager/IMoveManager'
import { MovePageZod } from './moveManagerLib/model/page'
import { z } from 'zod'
import { UserSettingsZod } from './moveManagerLib/model/userSettings'
import { dialog } from 'electron'
const moveManager: IMoveManager = undefined as any

type GetPageParams = {
  pageId: string
}

export const appRouter = router({
  userList: procedure.query(() => {
    return ['John', 'Jane', 'Jim']
  }),
  ping: procedure.mutation(() => {
    return 'pong'
  }),

  getAllDevices: procedure.query((opts) => {
    return opts.ctx.moveManager.getAllDevices()
  }),

  getAllSets: procedure.query((opts) => {
    return opts.ctx.moveManager.getAllSets()
  }),
  getAllPages: procedure.query((opts) => {
    return opts.ctx.moveManager.getAllPages()
  }),

  getPage: procedure.input(z.object({ pageId: z.string() })).query(async (opts) => {
    const { pageId } = opts.input
    const page = await opts.ctx.moveManager.getPage(pageId)
    return page
  }),

  downloadAllSets: procedure.mutation((opts) => {
    return opts.ctx.moveManager.downloadAllSets()
  }),

  uploadPage: procedure.input(z.object({ pageId: z.string() })).mutation((opts) => {
    return opts.ctx.moveManager.uploadPage(opts.input.pageId)
  }),

  createPage: procedure
    .input(z.object({ deviceId: z.string().optional(), page: MovePageZod }))
    .mutation((opts) => {
      return opts.ctx.moveManager.createPage(opts.input.page, opts.input.deviceId)
    }),

  getUserSettings: procedure.query((opts) => {
    return opts.ctx.moveManager.getUserSettings()
  }),

  updateUserSettings: procedure
    .input(z.object({ userSettings: UserSettingsZod }))
    .mutation((opts) => {
      return opts.ctx.moveManager.updateUserSettings(opts.input.userSettings)
    }),

  openSSHKeyFileSelectionDialog: procedure.mutation(async () => {
    console.log('Opening SSH key file selection dialog')
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'SSH Private Key', extensions: ['key', 'pem', 'ppk', '*'] }]
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  })
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
