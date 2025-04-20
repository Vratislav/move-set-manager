import { LocalDb } from "../localDb/localDB";
import { MoveSSHClient } from "../moveClient/MoveSSHClient";
import {
  startMockAbletonMoveServer,
  stopMockAbletonMoveServer,
} from "../testUtils";
import { MoveManager } from "./MoveManager";

beforeAll(async () => {
  await startMockAbletonMoveServer();
}, 20000);

afterAll(async () => {
  await stopMockAbletonMoveServer();
});

let moveManager: MoveManager;
beforeEach(async () => {
  const localDb = new LocalDb("./testDb");
  const ssh = new MoveSSHClient({
    host: "localhost",
    port: 2222,
    username: "ableton",
    privKeyPath: "./test.key",
  });

  moveManager = new MoveManager(localDb, ssh);
});

describe("MoveManager", () => {
  it("should download all sets", async () => {
    await moveManager.downloadAllSets();
    const allSets = await moveManager.getAllSets();
    expect(allSets.length).toBeGreaterThan(0);
    //Find the testing set
  });

  //   it("should get all sets", async () => {
  //     const sets = await moveManager.getAllSets();
  //     expect(sets.length).toBeGreaterThan(0);
  //   });
});
