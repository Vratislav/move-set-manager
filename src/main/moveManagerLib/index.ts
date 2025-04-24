import { initLocalDb } from "./localDb/localDB";

export function add(a: number, b: number): number {
  return a + b;
}

console.log("Hello from TypeScript!");
console.log(`1 + 2 = ${add(1, 2)}`);

initLocalDb();
