import fs from "node:fs";
import path from "node:path";

export const AUTH_DIR = path.join(__dirname, ".auth");
const USERS_FILE = path.join(AUTH_DIR, "users.json");

export type Role = "patient" | "otherPatient" | "admin";

export interface TestUser {
  role: Role;
  clerkId: string;
  dbId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface TestRun {
  runId: string;
  users: Record<Role, TestUser>;
}

export function saveRun(run: TestRun) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
  fs.writeFileSync(USERS_FILE, JSON.stringify(run, null, 2), { mode: 0o600 });
}

export function loadRun(): TestRun {
  return JSON.parse(fs.readFileSync(USERS_FILE, "utf8")) as TestRun;
}

export function storageStatePath(role: Role) {
  return path.join(AUTH_DIR, `${role}.json`);
}

export function fullName(u: TestUser) {
  return `${u.firstName} ${u.lastName}`;
}
