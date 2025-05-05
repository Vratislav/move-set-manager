import { z } from 'zod'

export type UserSettings = {
  sshPrivateKeyPath: string
  sshCustomHostname?: string
  sshCustomPort?: number
  sshCustomUsername?: string
  sshKeyHasPassphrase: boolean
  onboardingCompleted: boolean
}

export const UserSettingsZod = z.object({
  sshPrivateKeyPath: z.string(),
  sshKeyHasPassphrase: z.boolean(),
  onboardingCompleted: z.boolean(),
  sshCustomHostname: z.string().optional(),
  sshCustomPort: z.number().optional(),
  sshCustomUsername: z.string().optional()
})
