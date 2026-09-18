import { z } from "zod";
import { matcher as profanityMatcher } from "@/lib/profanity";

// USR-2: 3-24 chars, ASCII letters/digits/underscore/hyphen, must start
// with a letter or digit. The lookahead on the special-char branch means a
// '_'/'-' can only appear when followed by an alnum, which structurally
// rules out consecutive specials ("--", "__", "-_") and a trailing special
// in one regex, rather than needing separate checks for each.
export const USERNAME_PATTERN = /^[A-Za-z0-9](?:[A-Za-z0-9]|[_-](?=[A-Za-z0-9])){2,23}$/;

export const USERNAME_RULES_HELPER = "3–24 characters. Letters, numbers, underscores, and hyphens.";

export const UsernameSchema = z
  .string()
  .trim()
  .min(3, { message: "Username must be at least 3 characters." })
  .max(24, { message: "Username must be at most 24 characters." })
  .regex(USERNAME_PATTERN, {
    message: "Use letters, numbers, underscores, or hyphens. Start with a letter or number, and don't end with - or _.",
  })
  .refine((value) => !/^\d+$/.test(value), {
    message: "Username can't be all numbers.",
  })
  .refine((value) => !profanityMatcher.hasMatch(value), {
    message: "That username isn't allowed. Please choose another.",
  });

export type UsernameCheckResult =
  | { available: true }
  | { available: false; reason: string };
