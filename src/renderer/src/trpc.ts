import { createTRPCProxyClient, loggerLink } from '@trpc/client'
import { AppRouter } from '../../main/api'
import { ipcLink } from 'electron-trpc/renderer'

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [loggerLink({ enabled: (opts) => true }), ipcLink()]
})
