import { procedure, router } from './trpc'

export const appRouter = router({
  userList: procedure.query(() => {
    return ['John', 'Jane', 'Jim']
  }),
  ping: procedure.mutation(() => {
    return 'pong'
  })
})
// Export type router type signature,
// NOT the router itself.
export type AppRouter = typeof appRouter
