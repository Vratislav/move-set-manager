import { createTRPCReact } from '@trpc/react-query'
import { createTRPCProxyClient } from '@trpc/client'
import { AppRouter } from '../../main/api'
import { ipcLink } from 'electron-trpc/renderer'

export const trpcReact = createTRPCReact<AppRouter>()
export const trpcClient = createTRPCProxyClient<AppRouter>({ links: [ipcLink()] })
