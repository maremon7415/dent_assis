import { PrismaClient } from "@prisma/client";
import "./env";

let client: PrismaClient | null = null;

/** Direct database access for arranging state the UI can't create (a visit in the past). */
export function db() {
  client ??= new PrismaClient();
  return client;
}
