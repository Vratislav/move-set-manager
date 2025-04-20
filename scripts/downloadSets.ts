import path from "path";
import { LocalDb } from "../src/localDb/localDB";
import { MoveSSHClient } from "../src/moveClient/MoveSSHClient";
import { MoveManager } from "../src/moveManager/MoveManager";

const PROD_DB_PATH = "./db";

async function main() {
  const localDb = new LocalDb(PROD_DB_PATH);
  const ssh = new MoveSSHClient({
    host: "move.local",
    port: 22,
    username: "ableton",
    privKeyPath: path.join(process.env.HOME!, ".ssh/ableton"),
  });
  const moveManager = new MoveManager(localDb, ssh);
  console.log("Downloading all sets");
  const sets = await moveManager.downloadAllSets();
  console.log("Done!");
  console.log(`Downloaded ${sets.length} sets`);
}

main();
