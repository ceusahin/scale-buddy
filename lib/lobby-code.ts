const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

export function generateLobbyCode(): string {
  let code = "";
  const randomValues = new Uint32Array(5);
  crypto.getRandomValues(randomValues);
  for (let i = 0; i < 5; i++) {
    code += CHARS[randomValues[i]! % CHARS.length];
  }
  return code;
}
