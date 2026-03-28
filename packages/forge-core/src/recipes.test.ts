import { describe, expect, it } from "vitest";
import {
  getForgeRecipeMap,
  getForgeRecipes,
  getForgeRelevantItemNames,
  normalizeItemName,
  slugifyName,
} from "./recipes";

describe("recipes", () => {
  it("normalizes item names by stripping formatting and standardizing tokens", () => {
    expect(normalizeItemName("§aEnchanted_Mithril-Item")).toBe(
      "enchanted mithril"
    );
    expect(normalizeItemName("[Lvl 100] Perfect Jade Gem")).toBe(
      "perfect jade gemstone"
    );
    expect(normalizeItemName(" Collection Item   Tungsten_Gem ")).toBe(
      "tungsten gemstone"
    );
  });

  it("slugifies names from their normalized form", () => {
    expect(slugifyName("Perfect Jade Gem")).toBe("perfect_jade_gemstone");
    expect(slugifyName("  Goblin-Omelette: Spicy  ")).toBe(
      "goblin_omelette_spicy"
    );
  });

  it("exposes the recipe data and map consistently", () => {
    const recipes = getForgeRecipes();
    const recipeMap = getForgeRecipeMap();

    expect(recipes.length).toBeGreaterThan(0);
    expect(recipeMap.size).toBe(recipes.length);

    const firstRecipe = recipes[0];
    expect(recipeMap.get(firstRecipe.id)).toEqual(firstRecipe);
  });

  it("collects relevant item names from outputs and nested ingredients without duplicates", () => {
    const relevantNames = getForgeRelevantItemNames();
    const uniqueNames = new Set(relevantNames);

    expect(relevantNames.length).toBe(uniqueNames.size);
    expect(relevantNames.length).toBeGreaterThan(0);

    const recipes = getForgeRecipes();
    const firstOutput = normalizeItemName(recipes[0].output.name);
    expect(uniqueNames.has(firstOutput)).toBe(true);

    const nestedIngredient = recipes
      .flatMap((recipe) => recipe.ingredients)
      .find(
        (ingredient) => ingredient.children && ingredient.children.length > 0
      );

    expect(nestedIngredient).toBeDefined();
    if (nestedIngredient?.children?.[0]) {
      expect(
        uniqueNames.has(normalizeItemName(nestedIngredient.children[0].name))
      ).toBe(true);
    }
  });
});
