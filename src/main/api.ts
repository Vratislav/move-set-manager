import { procedure, router } from './trpc'
import { MovePageZod } from './moveManagerLib/model/page'
import { z } from 'zod'
import { UserSettingsZod } from './moveManagerLib/model/userSettings'
import { dialog } from 'electron'
import { MoveSetInPageZod } from './moveManagerLib/model/set'

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

  updatePage: procedure.input(z.object({ page: MovePageZod })).mutation((opts) => {
    return opts.ctx.moveManager.updatePage(opts.input.page)
  }),

  deletePage: procedure.input(z.object({ pageId: z.string() })).mutation((opts) => {
    return opts.ctx.moveManager.deletePage(opts.input.pageId)
  }),

  updateSetInPage: procedure
    .input(z.object({ page: MovePageZod, moveSetInPage: MoveSetInPageZod, setName: z.string() }))
    .mutation((opts) => {
      return opts.ctx.moveManager.updateSetInPage(
        opts.input.page,
        opts.input.moveSetInPage,
        opts.input.setName
      )
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
      return opts.ctx.moveManager.updateUserSettings({
        ...opts.input.userSettings,
        sshPrivateKeyPath: opts.input.userSettings.sshPrivateKeyPath || '',
        sshKeyHasPassphrase: opts.input.userSettings.sshKeyHasPassphrase || false,
        onboardingCompleted: opts.input.userSettings.onboardingCompleted || false
      })
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
  }),

  openDownloadAllAblBundlesDirectorySelectionDialog: procedure.mutation(async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select directory to download all ABL bundles to',
      buttonLabel: 'Select dir & download'
    })
    if (canceled) {
      return null
    }
    return filePaths[0]
  }),

  startRestApiChallenge: procedure.mutation(async (opts) => {
    return opts.ctx.moveManager.startRestApiChallenge()
  }),

  submitRestApiChallengeResponse: procedure
    .input(z.object({ secret: z.string() }))
    .mutation(async (opts) => {
      const { secret } = opts.input
      return opts.ctx.moveManager.submitRestApiChallengeResponse(secret)
    }),

  downloadAllAblBundles: procedure
    .input(z.object({ targetDir: z.string() }))
    .mutation(async (opts) => {
      const { targetDir } = opts.input
      return opts.ctx.moveManager.downloadAllAblBundles(targetDir)
    })
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
