import { z } from 'zod'

export type UserSettings = {
  sshPrivateKeyPath: string
  sshKeyHasPassphrase: boolean
  onboardingCompleted: boolean
}

export const UserSettingsZod = z.object({
  sshPrivateKeyPath: z.string(),
  sshKeyHasPassphrase: z.boolean(),
  onboardingCompleted: z.boolean()
})
