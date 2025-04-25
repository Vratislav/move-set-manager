import { MoveSetInPage, MoveSetInPageZod } from './set'
import { z } from 'zod'

export type MovePage = {
  id: string
  name: string
  sets: MoveSetInPage[]
}

export const MovePageZod = z.object({
  id: z.string(),
  name: z.string(),
  sets: z.array(MoveSetInPageZod)
})
