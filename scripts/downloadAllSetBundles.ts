import * as readline from 'readline'
import * as path from 'path'
import * as fs from 'fs/promises'
import { MoveManager } from '../src/main/moveManagerLib/moveManager/MoveManager'
import { LocalDb } from '../src/main/moveManagerLib/localDb/localDB'
import {
  MoveSSHClient,
  SSHConnectionOpts
} from '../src/main/moveManagerLib/moveClient/MoveSSHClient'

async function setupDirectories(homeDir: string) {
  const localDbRootDir = path.join('./testDb')
  const targetDownloadDir = path.join(homeDir, 'Downloads', 'MoveSetBundles')

  await fs.mkdir(localDbRootDir, { recursive: true })
  await fs.mkdir(targetDownloadDir, { recursive: true })

  return { localDbRootDir, targetDownloadDir }
}

async function main() {
  const homeDir = process.env.HOME
  if (!homeDir) {
    console.error('HOME environment variable is not set.')
    process.exit(1)
  }

  const { localDbRootDir, targetDownloadDir } = await setupDirectories(homeDir)

  const localDb = new LocalDb(localDbRootDir)

  // Default SSH options. MoveManager will try to override these from LocalDb's UserSettings if available.
  const defaultSshOpts: SSHConnectionOpts = {
    privKeyPath: path.join(homeDir, '.ssh', 'ableton') // A common default private key path
    // host, port, username will use MoveSSHClient defaults or be overridden by UserSettings via MoveManager
  }
  const sshClient = new MoveSSHClient(defaultSshOpts)

  const moveManager = new MoveManager(localDb, sshClient)

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  try {
    console.log('Initiating challenge for REST API access...')
    await moveManager.startRestApiChallenge()
    console.log('Please check your Ableton Move device for a challenge code.')

    const secret = await new Promise<string>((resolve) => {
      rl.question('Enter the secret code from your Move device: ', (answer) => {
        resolve(answer.trim())
      })
    })

    if (!secret) {
      console.error('No secret provided. Exiting.')
      rl.close()
      return
    }

    console.log('Submitting challenge response...')
    const cookie = await moveManager.submitRestApiChallengeResponse(secret)

    if (cookie) {
      console.log('Challenge successful. Cookie obtained internally by the client.')
      console.log(`Attempting to download all set bundles to: ${targetDownloadDir}`)

      const downloadedFiles = await moveManager.downloadAllAblBundles(targetDownloadDir)

      if (downloadedFiles.length > 0) {
        console.log('Successfully downloaded the following set bundles:')
        downloadedFiles.forEach((filePath) => console.log(`- ${filePath}`))
      } else {
        console.log(
          'No set bundles were downloaded. The device might not have any sets or an issue occurred.'
        )
      }
    } else {
      console.error('Challenge response failed. Could not obtain cookie. Bundle download aborted.')
    }
  } catch (error) {
    console.error('An error occurred during the process:', error)
  } finally {
    rl.close()
  }
}

main().catch((err) => {
  console.error('Unhandled error in main execution:', err)
  process.exit(1)
})
