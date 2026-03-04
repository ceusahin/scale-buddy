/** Komik avatar havuzu: id → emoji. Girişte kullanıcı bunlardan birini seçer. */
export const AVATARS = [
  { id: "fox", emoji: "🦊" },
  { id: "frog", emoji: "🐸" },
  { id: "owl", emoji: "🦉" },
  { id: "dragon", emoji: "🐲" },
  { id: "unicorn", emoji: "🦄" },
  { id: "pig", emoji: "🐷" },
  { id: "chicken", emoji: "🐔" },
  { id: "butterfly", emoji: "🦋" },
  { id: "octopus", emoji: "🐙" },
  { id: "dino", emoji: "🦖" },
  { id: "alien", emoji: "👾" },
  { id: "robot", emoji: "🤖" },
  { id: "pumpkin", emoji: "🎃" },
  { id: "pizza", emoji: "🍕" },
  { id: "avocado", emoji: "🥑" },
  { id: "ghost", emoji: "👻" },
  { id: "clown", emoji: "🤡" },
  { id: "monkey", emoji: "🐵" },
  { id: "cat", emoji: "🐱" },
  { id: "dog", emoji: "🐶" },
] as const;

export const AVATAR_IDS = AVATARS.map((a) => a.id);
export const DEFAULT_AVATAR_ID = AVATARS[0]!.id;

export function getAvatarEmoji(avatarId: string | null | undefined): string {
  if (!avatarId) return AVATARS[0]!.emoji;
  const found = AVATARS.find((a) => a.id === avatarId);
  return found?.emoji ?? AVATARS[0]!.emoji;
}
