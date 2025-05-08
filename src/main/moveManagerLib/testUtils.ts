import { exec } from 'child_process'
import fs from 'fs'
import path from 'path'
import { MoveSSHClient } from './moveClient/MoveSSHClient'
import { NodeSSH } from 'node-ssh'
import { MOVE_SET_DIR_PATH } from './model/abletonMove'
import { getDirectoryListing } from './moveClient/sshUtils'
import { SFTPWrapper } from 'ssh2'

export const TEST_SET_ID = '0aa3ea3a-0a1b-4169-b3d9-14d72575d7ec'

function setupTestUserLibrary() {
  const workingDir = process.cwd()
  const userLibraryTestDir = path.join(workingDir, 'UserLibrary_Test')
  //Remove UserLibrary_Test if it exists in the working dir
  if (fs.existsSync(userLibraryTestDir)) {
    fs.rmSync(userLibraryTestDir, { recursive: true })
  }
  //Copy UserLibrary to UserLibrary_Test
  const userLibraryDir = path.join(workingDir, 'UserLibrary')
  fs.cpSync(userLibraryDir, userLibraryTestDir, { recursive: true })
}

export function wipeTestDb(dbPath: string) {
  if (fs.existsSync(dbPath)) {
    fs.rmSync(dbPath, { recursive: true })
  }
}

export async function refreshTestDataInContainer() {
  const ssh = new NodeSSH()
  await ssh.connect({
    host: '127.0.0.1',
    port: 2222,
    privateKeyPath: './test.key',
    username: 'ableton'
  })
  const sftp = await ssh.requestSFTP()
  await copyTestUserLibraryIntoDockerFileSystem()
  await setupSetExtendedAttributes(sftp, ssh)
  ssh.dispose()
}

async function copyTestUserLibraryIntoDockerFileSystem() {
  return new Promise<void>((resolve, reject) => {
    const command =
      "docker exec openssh-server sh -c 'rm -rf /data/UserData/UserLibrary && mkdir -p /data/UserData/UserLibrary && cp -a /data/UserData/UserLibrary_Test/. /data/UserData/UserLibrary/ && chown -R 501:20 /data/UserData/UserLibrary'"
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error)
        reject(error)
      }
      //console.log("Copied test user library into docker file system");
      //console.log(stdout);
      resolve()
    })
  })
}

async function setupSetExtendedAttributes(sftp: SFTPWrapper, ssh: NodeSSH): Promise<void> {
  const setsDir = MOVE_SET_DIR_PATH
  //console.log("Setting extended attributes for sets in", setsDir);
  const setsDirStats = await getDirectoryListing(sftp, setsDir)
  //console.log("Found", setsDirStats.length, "sets");
  let setIndex = 0
  let colorIndex = 0
  for (const setDirStat of setsDirStats) {
    const setDirPath = path.join(setsDir, setDirStat.filename)
    const value = ['-n', 'user.song-index', '-v', setIndex.toString(), setDirPath]
    // console.log("setfattr ", value.join(" "));
    await ssh.exec('setfattr', value)
    await ssh.exec('setfattr', [
      '-n',
      'user.song-color',
      '-v',
      (colorIndex % 26).toString(),
      setDirPath
    ])
    await ssh.exec('setfattr', ['-n', 'user.was-externally-modified', '-v', 'false', setDirPath])
    await ssh.exec('setfattr', ['-n', 'user.local-cloud-state', '-v', 'notSynced', setDirPath])
    await ssh.exec('setfattr', [
      '-n',
      'user.last-modified-time',
      '-v',
      '2025-04-18T15:00:24Z',
      setDirPath
    ])

    setIndex++
    colorIndex++
  }
}

// Start the docker-compose file in daemon mode
export async function startMockAbletonMoveServer() {
  //setupTestUserLibrary();
  const workingDir = process.cwd()
  const dockerComposeFile = path.join(workingDir, 'docker-compose.yml')
  const command = `docker compose up -d`
  await new Promise<void>((resolve, reject) => {
    // output the command result to the console
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error)
        reject(error)
      }
      console.log(stdout)

      resolve()
    })
  })
  let i = 0
  let serverStarted = false
  while (i < 10) {
    try {
      await refreshTestDataInContainer()
      serverStarted = true
      break
    } catch (e) {
      console.log(e)
      await new Promise((resolve) => setTimeout(resolve, 500))
    } finally {
      i++
    }
  }
  if (!serverStarted) {
    throw new Error('Server did not start')
  }
}

export async function stopMockAbletonMoveServer() {
  const workingDir = process.cwd()
  const dockerComposeFile = path.join(workingDir, 'docker-compose.yml')
  const command = `docker compose down`
  // output the command result to the console
  return new Promise<void>((resolve, reject) => {
    // output the command result to the console
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(error)
        reject(error)
      }
      console.log(stdout)
      //wait for 1 second
      setTimeout(() => {
        resolve()
      }, 3000)
    })
  })
}
