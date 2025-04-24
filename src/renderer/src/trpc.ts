import { createTRPCReact } from '@trpc/react-query'
import { AppRouter } from '../../main/api'

export const trpcReact = createTRPCReact<AppRouter>()
