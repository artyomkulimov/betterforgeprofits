import recipeData from "../data/forge-recipes.json";
import type { ForgeRecipe, RecipeIngredient } from "./types";

const recipes = recipeData as ForgeRecipe[];

export function getForgeRecipes(): ForgeRecipe[] {
  return recipes;
}

export function getForgeRecipeMap(): Map<string, ForgeRecipe> {
  return new Map(recipes.map((recipe) => [recipe.id, recipe]));
}

export function normalizeItemName(name: string): string {
  return name
    .replace(/\u00a7./g, "")
    .replace(/\[[^\]]*]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\b(?:item|collection item)\b/gi, "")
    .replace(/\s+gem\b/gi, " gemstone")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function slugifyName(name: string): string {
  return normalizeItemName(name)
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function visitIngredient(
  ingredient: RecipeIngredient,
  seen: Set<string>,
  names: Set<string>
) {
  const normalized = normalizeItemName(ingredient.name);
  if (!seen.has(normalized)) {
    seen.add(normalized);
    names.add(normalized);
  }

  for (const child of ingredient.children ?? []) {
    visitIngredient(child, seen, names);
  }
}

export function getForgeRelevantItemNames(): string[] {
  const seen = new Set<string>();
  const names = new Set<string>();

  for (const recipe of recipes) {
    names.add(normalizeItemName(recipe.output.name));
    for (const ingredient of recipe.ingredients) {
      visitIngredient(ingredient, seen, names);
    }
  }

  return [...names];
}
