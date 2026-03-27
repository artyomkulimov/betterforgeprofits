import fs from "node:fs";
import path from "node:path";
import { load } from "cheerio";
import type {
  ForgeCategory,
  ForgeRecipe,
  RecipeIngredient,
} from "@betterforgeprofits/forge-core/types";

type SelectorArg = Parameters<ReturnType<typeof load>>[0];
type MinimalCheerio = {
  children(selector?: string): MinimalCheerio;
  clone(): MinimalCheerio;
  eq(index: number): MinimalCheerio;
  find(selector: string): MinimalCheerio;
  first(): MinimalCheerio;
  next(): MinimalCheerio;
  parent(): MinimalCheerio;
  remove(): void;
  slice(start?: number, end?: number): MinimalCheerio;
  text(): string;
  toArray(): SelectorArg[];
};

const ROOT = process.cwd();
const SOURCE_HTML = path.join(
  ROOT,
  "scratchpad/forge-guide/forge guide hypixel.html"
);
const OUTPUT_JSON = path.join(ROOT, "data/forge-recipes.json");

const categories = new Set<ForgeCategory>([
  "Refining",
  "Forging",
  "Tools",
  "Gear",
  "Reforge Stones",
  "Drill Parts",
  "Perfect Gemstones",
  "Pets",
  "Other",
]);

function cleanText(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\[\s*]/g, "")
    .replace(/\s+\./g, ".")
    .trim();
}

function slugifyName(name: string): string {
  return cleanText(name)
    .replace(/\u00a7./g, "")
    .replace(/\[[^\]]*]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseNumber(raw: string): number {
  return Number(raw.replace(/,/g, ""));
}

function parseTimeToMs(raw: string): number {
  const value = cleanText(raw).toLowerCase();
  let total = 0;

  for (const match of value.matchAll(
    /(\d+)\s+(second|seconds|minute|minutes|hour|hours|day|days)/g
  )) {
    const amount = Number(match[1]);
    const unit = match[2];
    if (unit.startsWith("second")) {
      total += amount * 1000;
    } else if (unit.startsWith("minute")) {
      total += amount * 60_000;
    } else if (unit.startsWith("hour")) {
      total += amount * 3_600_000;
    } else if (unit.startsWith("day")) {
      total += amount * 86_400_000;
    }
  }

  return total;
}

function parseQuantityAndName(
  raw: string
): { quantity: number; name: string } | null {
  const cleaned = cleanText(raw);
  const match = cleaned.match(/^([\d,]+)\s+(.+)$/);
  if (!match) {
    return null;
  }

  return {
    quantity: parseNumber(match[1]),
    name: cleanText(match[2]),
  };
}

function parseIngredient(
  $: ReturnType<typeof load>,
  element: SelectorArg
): RecipeIngredient | null {
  const item = $(element) as unknown as MinimalCheerio;
  const clone = item.clone();
  clone.children("ul").remove();

  const parsed = parseQuantityAndName(clone.text());
  if (!parsed) {
    return null;
  }

  const nestedLists = item.children("ul");
  const children = nestedLists
    .children("li")
    .toArray()
    .map((child) => parseIngredient($, child))
    .filter((child): child is RecipeIngredient => child !== null);

  const ingredient: RecipeIngredient = {
    itemId: parsed.name.toLowerCase() === "coins" ? "COINS" : null,
    name: parsed.name,
    quantity: parsed.quantity,
    kind: parsed.name.toLowerCase() === "coins" ? "coins" : "item",
  };

  if (children.length > 0) {
    ingredient.children = children;
  }

  return ingredient;
}

function parseRequirements(raw: string) {
  const text = cleanText(raw);
  const lines = text
    .split(
      /(?=Heart of the Mountain Tier \d+)|(?=[A-Z][a-z]+ Collection )|(?=Talk to )|(?=Riding a )/
    )
    .map((line) => cleanText(line))
    .filter(Boolean);

  const hotmMatch = text.match(/Heart of the Mountain Tier (\d+)/i);
  return {
    hotmTier: hotmMatch ? Number(hotmMatch[1]) : null,
    text: lines.length > 0 ? lines : text ? [text] : [],
  };
}

function parseOutput(container: MinimalCheerio) {
  const headerText = cleanText(container.children("span").first().text());
  const parsed = parseQuantityAndName(headerText);
  if (parsed) {
    return {
      itemId: null,
      name: parsed.name,
      quantity: parsed.quantity,
    };
  }

  return {
    itemId: null,
    name: headerText,
    quantity: 1,
  };
}

function parseCategoryTable(
  $: ReturnType<typeof load>,
  category: ForgeCategory,
  table: SelectorArg
): ForgeRecipe[] {
  const rows = ($(table) as unknown as MinimalCheerio)
    .find("> tbody > tr")
    .slice(1)
    .toArray();

  return rows.map((row) => {
    const cells = ($(row) as unknown as MinimalCheerio).find("> td");
    const nameCell = cells.eq(1);
    const durationCell = cells.eq(2);
    const recipeTreeCell = cells.eq(3);
    const requirementCell = cells.eq(4);

    const name = cleanText(
      nameCell.find("a").first().text() || nameCell.text()
    );
    const treeContainer = recipeTreeCell.find(".mw-hp-tree-container").first();
    const output = parseOutput(treeContainer);
    const directIngredients = treeContainer
      .find("> ul.mw-hp-tree > li")
      .toArray()
      .map((ingredient) => parseIngredient($, ingredient))
      .filter(
        (ingredient): ingredient is RecipeIngredient => ingredient !== null
      );

    const recipe: ForgeRecipe = {
      id: slugifyName(name),
      name,
      category,
      output,
      durationMs: parseTimeToMs(durationCell.text()),
      requirements: parseRequirements(requirementCell.text()),
      directIngredients,
      ingredients: directIngredients,
    };

    return recipe;
  });
}

function main() {
  const html = fs.readFileSync(SOURCE_HTML, "utf8");
  const $ = load(html);
  const recipesHeading = $("#Recipes").first();

  if (recipesHeading.length === 0) {
    throw new Error("Recipes section not found in forge guide HTML.");
  }

  const parsedRecipes: ForgeRecipe[] = [];
  let pointer = recipesHeading.parent().next();

  while (pointer.length > 0) {
    if (pointer.is("h2")) {
      break;
    }

    if (pointer.is("h3")) {
      const categoryName = cleanText(pointer.text()) as ForgeCategory;
      if (categories.has(categoryName)) {
        let tablePointer = pointer.next();
        while (
          tablePointer.length > 0 &&
          !(
            tablePointer.is("table.wikitable") ||
            tablePointer.is("h3") ||
            tablePointer.is("h2")
          )
        ) {
          tablePointer = tablePointer.next();
        }

        if (tablePointer.is("table.wikitable")) {
          const tableElement = tablePointer.get(0);
          if (tableElement) {
            parsedRecipes.push(
              ...parseCategoryTable($, categoryName, tableElement)
            );
            pointer = tablePointer;
          }
        }
      }
    }

    pointer = pointer.next();
  }

  fs.mkdirSync(path.dirname(OUTPUT_JSON), { recursive: true });
  fs.writeFileSync(OUTPUT_JSON, `${JSON.stringify(parsedRecipes, null, 2)}\n`);
  console.log(`Wrote ${parsedRecipes.length} forge recipes to ${OUTPUT_JSON}`);
}

main();
