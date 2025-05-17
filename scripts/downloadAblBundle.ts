import { MoveRestApiClient } from '../src/main/moveManagerLib/moveClient/MoveRestApiClient'
import * as readline from 'readline'

const restClient = new MoveRestApiClient('http://move.local')
const setId = '9c68b414-e379-4d07-9b0e-b3a70b88166c'
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

async function main() {
  try {
    console.log('Initiating challenge...')
    await restClient.getChallenge()
    console.log('Please check your Ableton Move device for a challenge code.')

    const secret = await new Promise<string>((resolve) => {
      rl.question('Enter the secret code: ', (answer) => {
        resolve(answer.trim())
      })
    })

    if (!secret) {
      console.error('No secret provided. Exiting.')
      rl.close()
      return
    }

    console.log('Submitting challenge response...')
    const cookie = await restClient.submitChallengeResponse(secret)

    if (cookie) {
      console.log('Challenge successful. Cookie obtained:', cookie)
      // The cookie is also stored internally in restClient

      const targetDownloadDir = `${process.env.HOME}/Downloads/` // Make sure this path is writable and is a directory
      console.log(`Attempting to download set ${setId} to directory ${targetDownloadDir}...`)
      const downloadedFilePath = await restClient.downloadSetAblBundle(setId, targetDownloadDir)
      console.log(`Download complete! File saved to: ${downloadedFilePath}`)
    } else {
      console.error('Challenge response failed. Could not obtain cookie.')
    }
  } catch (error) {
    console.error('An error occurred:', error)
  } finally {
    rl.close()
  }
}

main()
