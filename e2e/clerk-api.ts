import { clerkSecretKey } from "./env";

const API = "https://api.clerk.com/v1";

async function clerk<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${clerkSecretKey()}`,
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) {
    // Never echo request headers; the body of a Clerk error has no secrets.
    throw new Error(
      `Clerk ${method} ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

export async function createClerkUser(input: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}): Promise<{ id: string }> {
  return clerk("POST", "/users", {
    email_address: [input.email],
    password: input.password,
    first_name: input.firstName,
    last_name: input.lastName,
    skip_password_checks: true,
  });
}

export async function deleteClerkUser(id: string) {
  await clerk("DELETE", `/users/${id}`);
}
