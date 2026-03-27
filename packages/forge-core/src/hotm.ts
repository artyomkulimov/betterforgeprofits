import hotmThresholds from "../data/hotm-thresholds.json";

const cumulativeThresholds = hotmThresholds as number[];

export function quickForgeReductionForLevel(level: number): number {
  return Math.min(0.1 + level * 0.005, 0.3);
}

export function effectiveForgeDuration(
  durationMs: number,
  quickForgeLevel: number
): number {
  return Math.round(
    durationMs * (1 - quickForgeReductionForLevel(quickForgeLevel))
  );
}

export function deriveHotmTierFromExp(
  exp: number | null | undefined
): number | null {
  if (typeof exp !== "number" || Number.isNaN(exp) || exp < 0) {
    return null;
  }

  let tier = 1;

  for (let index = 0; index < cumulativeThresholds.length; index += 1) {
    if (exp >= cumulativeThresholds[index]) {
      tier = index + 1;
    }
  }

  return tier;
}

function deepFindValue(subject: unknown, matchers: string[]): unknown {
  if (!subject || typeof subject !== "object") {
    return null;
  }

  if (Array.isArray(subject)) {
    for (const entry of subject) {
      const found = deepFindValue(entry, matchers);
      if (found !== null && found !== undefined) {
        return found;
      }
    }
    return null;
  }

  for (const [key, value] of Object.entries(subject)) {
    const normalized = key.toLowerCase();
    if (
      matchers.some(
        (matcher) => normalized === matcher || normalized.includes(matcher)
      ) &&
      value !== null &&
      value !== undefined
    ) {
      return value;
    }
    const found = deepFindValue(value, matchers);
    if (found !== null && found !== undefined) {
      return found;
    }
  }

  return null;
}

export function extractQuickForgeLevel(member: unknown): number {
  const directNodes = (
    member as { mining_core?: { nodes?: Record<string, unknown> } }
  )?.mining_core?.nodes;
  const directValue = directNodes?.quick_forge;

  if (typeof directValue === "number") {
    return directValue;
  }

  const skillTreeValue = (
    member as { skill_tree?: { nodes?: { mining?: Record<string, unknown> } } }
  )?.skill_tree?.nodes?.mining?.quick_forge;
  if (typeof skillTreeValue === "number") {
    return skillTreeValue;
  }

  const found = deepFindValue(member, ["quick_forge"]);
  return typeof found === "number" ? found : 0;
}

export function extractHotmTier(member: unknown): number | null {
  const miningCore = (member as { mining_core?: Record<string, unknown> })
    ?.mining_core;
  const skillTree = (
    member as {
      skill_tree?: {
        nodes?: { mining?: Record<string, unknown> };
        experience?: Record<string, unknown>;
      };
    }
  )?.skill_tree;
  const directCandidates = [
    miningCore?.tier,
    miningCore?.hotm_tier,
    miningCore?.experience_level,
    skillTree?.nodes?.mining?.core_of_the_mountain,
  ];

  for (const candidate of directCandidates) {
    if (typeof candidate === "number" && candidate >= 1 && candidate <= 10) {
      return candidate;
    }
  }

  const expCandidate = [
    miningCore?.experience,
    miningCore?.hotm_experience,
    miningCore?.exp,
    skillTree?.experience?.mining,
    deepFindValue(miningCore, ["hotm_xp", "experience", "hotmexp"]),
    deepFindValue(member, ["hotm_xp", "hotmexperience"]),
  ].find((value) => typeof value === "number");

  return deriveHotmTierFromExp(
    typeof expCandidate === "number" ? expCandidate : null
  );
}
