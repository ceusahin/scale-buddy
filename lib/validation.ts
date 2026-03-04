import { z } from "zod";

const LOBBY_CODE_REGEX = /^[A-Z0-9]{5}$/;

export const lobbyCodeSchema = z
  .string()
  .length(5, "Kod 5 karakter olmalı")
  .regex(LOBBY_CODE_REGEX, "Kod 5 büyük harf veya rakam olmalı");

import { AVATAR_IDS } from "./avatars";

const avatarIdSchema = z
  .string()
  .refine((id) => (AVATAR_IDS as readonly string[]).includes(id), "Geçersiz avatar")
  .optional();

export const createLobbySchema = z.object({
  nickname: z.string().min(1).max(30).trim(),
  avatarId: avatarIdSchema,
});

export const joinLobbySchema = z.object({
  code: lobbyCodeSchema,
  nickname: z.string().min(1).max(30).trim(),
  avatarId: avatarIdSchema,
});

export const startGameSchema = z.object({
  lobbyId: z.string().cuid(),
  modeId: z.string().cuid(),
});

export const voteSchema = z.object({
  gameId: z.string().cuid(),
  questionId: z.string().cuid(),
  votedForId: z.string().cuid(),
});

export const feedbackSchema = z.object({
  type: z.enum(["suggestion", "complaint"]),
  text: z.string().min(1, "Metin gerekli").max(2000, "En fazla 2000 karakter").trim(),
});

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const adminUpdateSchema = z.object({
  currentPassword: z.string().min(1, "Mevcut şifre gerekli"),
  newEmail: z.string().email().optional(),
  newPassword: z.string().min(6, "Yeni şifre en az 6 karakter olmalı").optional(),
}).refine((d) => d.newEmail ?? d.newPassword, { message: "Yeni e-posta veya yeni şifre girin" });

export const categorySchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
});

export const questionSchema = z.object({
  text: z.string().min(1).max(500),
  categoryId: z.string().cuid(),
});

export const modeSchema = z.object({
  name: z.string().min(1).max(100),
  isActive: z.boolean().default(true),
  categoryIds: z.array(z.string().cuid()).default([]),
});

export type CreateLobbyInput = z.infer<typeof createLobbySchema>;
export type JoinLobbyInput = z.infer<typeof joinLobbySchema>;
export type VoteInput = z.infer<typeof voteSchema>;
export type AdminLoginInput = z.infer<typeof adminLoginSchema>;
export type CategoryInput = z.infer<typeof categorySchema>;
export type QuestionInput = z.infer<typeof questionSchema>;
export type ModeInput = z.infer<typeof modeSchema>;
