import fs from 'fs/promises'
import path from 'path'
// import fetch from 'node-fetch' // Or use global fetch if available in your Node version

export interface IMoveRestApiClient {
  downloadSetAblBundle(setId: string, targetDir: string): Promise<string>
  getChallenge(): Promise<void>
  submitChallengeResponse(secret: string): Promise<string | null>
}

export class MoveRestApiClient implements IMoveRestApiClient {
  public baseUrl: string
  private cookie: string | null = null

  constructor(baseUrl: string, initialCookie?: string) {
    // Ensure baseUrl does not end with a slash to prevent double slashes in URL construction
    if (baseUrl.endsWith('/')) {
      this.baseUrl = baseUrl.slice(0, -1)
    } else {
      this.baseUrl = baseUrl
    }
    if (initialCookie) {
      this.cookie = initialCookie
    }
  }

  async downloadSetAblBundle(setId: string, targetDir: string): Promise<string> {
    const downloadUrl = `${this.baseUrl}/api/v1/data/Sets/${setId}`
    const headers: HeadersInit = {}
    if (this.cookie) {
      headers['Cookie'] = this.cookie
    }

    try {
      const response = await fetch(downloadUrl, { headers })
      if (!response.ok) {
        throw new Error(
          `Failed to download file from ${downloadUrl}: ${response.statusText} (status: ${response.status})`
        )
      }

      // Determine filename
      let filename = `${setId}.abl` // Default filename
      const contentDisposition = response.headers.get('content-disposition')
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"\n]+)"?/i)
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1]
        }
      }

      // Ensure the target directory exists
      await fs.mkdir(targetDir, { recursive: true })

      const localFilePath = path.join(targetDir, filename)

      const fileStream = await response.arrayBuffer()
      await fs.writeFile(localFilePath, Buffer.from(fileStream))
      console.log(`File downloaded successfully to ${localFilePath}`)
      return localFilePath
    } catch (error) {
      console.error('Error downloading set bundle:', error)
      throw error // Re-throw the error for the caller to handle
    }
  }

  async getChallenge(): Promise<void> {
    const challengeUrl = `${this.baseUrl}/api/v1/challenge`
    try {
      const response = await fetch(challengeUrl, { method: 'POST' })
      if (!response.ok) {
        throw new Error(
          `Failed to get challenge from ${challengeUrl}: ${response.statusText} (status: ${response.status})`
        )
      }
      // Assuming this endpoint doesn't return a body or we don't need it.
      // The challenge is displayed on the device itself as per user comments.
      console.log('Challenge request successful. Check device for code.')
    } catch (error) {
      console.error('Error getting challenge:', error)
      throw error
    }
  }

  async submitChallengeResponse(secret: string): Promise<string | null> {
    const challengeResponseUrl = `${this.baseUrl}/api/v1/challenge-response`
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    // If a cookie was already set (e.g. from a previous session or initial setup),
    // it might or might not be needed for challenge-response itself.
    // For now, not adding existing cookie to this specific request unless specified.

    try {
      const response = await fetch(challengeResponseUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ secret })
      })

      if (!response.ok) {
        throw new Error(
          `Failed to submit challenge response to ${challengeResponseUrl}: ${response.statusText} (status: ${response.status})`
        )
      }

      // Standard way to get Set-Cookie headers in modern Node.js fetch
      const setCookieHeaders = response.headers.getSetCookie?.()
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        for (const cookieStr of setCookieHeaders) {
          if (cookieStr.startsWith('Ableton-Challenge-Response-Token=')) {
            this.cookie = cookieStr.split(';')[0] // Stores "Ableton-Challenge-Response-Token=VALUE"
            console.log('Challenge response successful. Cookie set.')
            return this.cookie
          }
        }
        if (!this.cookie) {
          console.warn(
            'Challenge response successful, but Ableton-Challenge-Response-Token not found in Set-Cookie header.'
          )
        }
      } else {
        // Fallback for environments where getSetCookie might not be available or if header is different
        const rawSetCookieHeader = response.headers.get('set-cookie')
        if (
          rawSetCookieHeader &&
          rawSetCookieHeader.startsWith('Ableton-Challenge-Response-Token=')
        ) {
          this.cookie = rawSetCookieHeader.split(';')[0]
          console.log('Challenge response successful. Cookie set via fallback.')
          return this.cookie
        } else if (!this.cookie) {
          // check this.cookie again as it might have been set by getSetCookie
          console.warn(
            'Challenge response successful, but no Set-Cookie header found or token not present.'
          )
        }
      }

      if (!this.cookie) {
        // If cookie still not set, it's an issue.
        // Depending on strictness, could throw an error here.
        // For now, just a warning if no specific token found.
        console.warn('Ableton-Challenge-Response-Token was not found after challenge response.')
      }
      return null
    } catch (error) {
      console.error('Error submitting challenge response:', error)
      this.cookie = null // Clear cookie on error if a previous one existed
      throw error
    }
  }

  //POST http://move.local/api/v1/challenge (shows code on a screen)

  //POST http://move.local/api/v1/challenge-response
  //request payload: {secret: "703149"}

  //response: Set cookie
  // Ableton-Challenge-Response-Token=093e5a4f5a9b4cb4c08a87a5f7baed7ed4c4d8abde7a2c4075c233e37868f92f; path=/; HttpOnly; SameSite=Strict; Max-Age=2592000
}
