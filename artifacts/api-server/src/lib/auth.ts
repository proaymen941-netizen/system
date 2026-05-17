import crypto from "crypto";

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "salt_attendance_2024").digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateToken(employeeId: number): string {
  const payload = { employeeId, ts: Date.now() };
  const data = JSON.stringify(payload);
  const sig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "secret_key").update(data).digest("hex");
  return Buffer.from(data).toString("base64") + "." + sig;
}

export function verifyToken(token: string): { employeeId: number } | null {
  try {
    const [dataB64, sig] = token.split(".");
    if (!dataB64 || !sig) return null;
    const data = Buffer.from(dataB64, "base64").toString();
    const expectedSig = crypto.createHmac("sha256", process.env.SESSION_SECRET || "secret_key").update(data).digest("hex");
    if (sig !== expectedSig) return null;
    return JSON.parse(data);
  } catch {
    return null;
  }
}
