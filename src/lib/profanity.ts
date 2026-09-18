import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from "obscenity";

// USR-4: "Apply a profanity/offensive-term filter (use a maintained list;
// match against normalized variants)." `obscenity`'s recommended
// transformers normalize leetspeak/spacing/casing tricks before matching.
export const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});
