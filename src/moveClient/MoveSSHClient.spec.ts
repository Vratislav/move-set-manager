import os from "os";
import path from "path";
import {
  startMockAbletonMoveServer,
  stopMockAbletonMoveServer,
} from "../testUtils";
import { MoveSSHClient } from "./MoveSSHClient";
import fs from "fs";

beforeAll(async () => {
  await startMockAbletonMoveServer();
}, 20000);

afterAll(async () => {
  await stopMockAbletonMoveServer();
});

const connectionOpts = {
  port: 2222,
  host: "127.0.0.1",
  privKeyPath: "./test.key",
};

describe("MoveSSHClient", () => {
  it("should connect to the server", async () => {
    // const homeDir = os.homedir(); // Gets the user's home directory path
    // const keyPath = path.join(homeDir, ".ssh", "id_rsa"); // Constructs the full path
    const moveSSHClient = new MoveSSHClient(connectionOpts);
    try {
      await moveSSHClient.connect();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await moveSSHClient.disconnect();
    }
  });
  it("should list sets", async () => {
    const moveSSHClient = new MoveSSHClient(connectionOpts);
    try {
      await moveSSHClient.connect();
      const sets = await moveSSHClient.listSets();
      expect(sets.length).toEqual(30);
      //find set with the id 0aa3ea3a-0a1b-4169-b3d9-14d72575d7ec
      const set = sets.find(
        (set) => set.meta.id === "0aa3ea3a-0a1b-4169-b3d9-14d72575d7ec"
      );
      expect(set).not.toBeUndefined();
      expect(set?.meta.name).toEqual("TestSet");
      expect(set?.meta.wasExternallyModified).toEqual(false);
      expect(set?.meta.localCloudState).toEqual("notSynced");
      expect(set?.meta.color).toEqual(19);
      expect(set?.meta.color).toEqual(19);
      //Make sure the lastModifiedTime is a valid date
      expect(new Date(set?.meta.lastModifiedTime as string)).not.toBeNaN();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await moveSSHClient.disconnect();
    }
  });

  it("should download set", async () => {
    const moveSSHClient = new MoveSSHClient(connectionOpts);
    const tempDir = path.join(os.tmpdir(), "move-manager-test");

    try {
      await moveSSHClient.connect();
      const setId = "0aa3ea3a-0a1b-4169-b3d9-14d72575d7ec";
      const downloadedSet = await moveSSHClient.downloadSet(setId, tempDir);

      expect(downloadedSet.meta.id).toEqual(setId);
      expect(downloadedSet.meta.name).toEqual("TestSet");
      expect(downloadedSet.path).toEqual(path.join(tempDir, setId));

      // Verify the downloaded directory exists
      const dirExists = await fs.promises
        .access(downloadedSet.path)
        .then(() => true)
        .catch(() => false);
      expect(dirExists).toBe(true);
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await moveSSHClient.disconnect();
      // Clean up the temporary directory
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should get MAC address", async () => {
    const moveSSHClient = new MoveSSHClient(connectionOpts);
    try {
      await moveSSHClient.connect();
      const macAddress = await moveSSHClient.getMACAddress();
      //console.log(macAddress);
      expect(macAddress).not.toBeNull();
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      await moveSSHClient.disconnect();
    }
  });
});
