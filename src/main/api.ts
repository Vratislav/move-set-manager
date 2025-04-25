import { procedure, router } from './trpc'
import { IMoveManager } from './moveManagerLib/moveManager/IMoveManager'
import { MovePage, MovePageZod } from './moveManagerLib/model/page'
import { z } from 'zod'
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

  createPage: procedure
    .input(z.object({ deviceId: z.string().optional(), page: MovePageZod }))
    .mutation((opts) => {
      return opts.ctx.moveManager.createPage(opts.input.page, opts.input.deviceId)
    })
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
