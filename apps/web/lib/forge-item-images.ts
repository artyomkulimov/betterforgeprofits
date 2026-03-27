interface ForgeItemImage {
  alt: string;
  src: string;
}

function makeImage(name: string, file: string): ForgeItemImage {
  return {
    alt: name,
    src: `/forge-assets/${file}`,
  };
}

const DIRECT_IMAGE_MAP = {
  "Amber Material": "SkyBlock_items_amber_material.png",
  "Amber Necklace": "SkyBlock_items_amber_necklace.png",
  "Amber-Polished Drill Engine":
    "SkyBlock_items_amber_polished_drill_engine.png",
  "Amethyst Gauntlet": "SkyBlock_items_amethyst_gauntlet.png",
  "Bejeweled Collar": "SkyBlock_items_bejeweled_collar.png",
  Diamonite: "SkyBlock_items_diamonite.png",
  "Divan's Powder Coating": "SkyBlock_items_divan_powder_coating.png",
  "Dwarven Handwarmers": "SkyBlock_items_dwarven_handwarmers.png",
  "Frigid Husk": "SkyBlock_items_frigid_husk.png",
  "Gemstone Chamber": "SkyBlock_items_gemstone_chamber.png",
  "Gemstone Fuel Tank": "SkyBlock_items_gemstone_fuel_tank.png",
  "Gemstone Mixture": "SkyBlock_items_gemstone_mixture.png",
  "Glacite Amalgamation": "SkyBlock_items_glacite_amalgamation.png",
  "Gleaming Crystal": "SkyBlock_items_gleaming_crystal.png",
  "Goblin Omelette": "SkyBlock_items_goblin_omelette.png",
  "Golden Plate": "SkyBlock_items_golden_plate.png",
  "Jade Belt": "SkyBlock_items_jade_belt.png",
  "Mithril Belt": "SkyBlock_items_mithril_belt.png",
  "Mithril Cloak": "SkyBlock_items_mithril_cloak.png",
  "Mithril Gauntlet": "SkyBlock_items_mithril_gauntlet.png",
  "Mithril Necklace": "SkyBlock_items_mithril_necklace.png",
  "Mithril Plate": "SkyBlock_items_mithril_plate.png",
  "Pendant Of Divan": "SkyBlock_items_divan_pendant.png",
  "Perfect Amber Gemstone": "SkyBlock_items_perfect_amber_gem.png",
  "Perfect Amethyst Gemstone": "SkyBlock_items_perfect_amethyst_gem.png",
  "Perfect Aquamarine Gemstone": "SkyBlock_items_perfect_aquamarine_gem.png",
  "Perfect Citrine Gemstone": "SkyBlock_items_perfect_citrine_gem.png",
  "Perfect Jade Gemstone": "SkyBlock_items_perfect_jade_gem.png",
  "Perfect Jasper Gemstone": "SkyBlock_items_perfect_jasper_gem.png",
  "Perfect Onyx Gemstone": "SkyBlock_items_perfect_onyx_gem.png",
  "Perfect Opal Gemstone": "SkyBlock_items_perfect_opal_gem.png",
  "Perfect Peridot Gemstone": "SkyBlock_items_perfect_peridot_gem.png",
  "Perfect Plate": "SkyBlock_items_perfect_plate.png",
  "Perfect Ruby Gemstone": "SkyBlock_items_perfect_ruby_gem.png",
  "Perfect Sapphire Gemstone": "SkyBlock_items_perfect_sapphire_gem.png",
  "Perfect Topaz Gemstone": "SkyBlock_items_perfect_topaz_gem.png",
  "Perfectly-Cut Fuel Tank": "SkyBlock_items_perfectly_cut_fuel_tank.png",
  "Petrified Starfall": "SkyBlock_items_petrified_starfall.png",
  "Pocket Iceberg": "SkyBlock_items_pocket_iceberg.png",
  "Pure Mithril": "SkyBlock_items_pure_mithril.png",
  "Refined Diamond": "SkyBlock_items_refined_diamond.png",
  "Refined Mithril": "SkyBlock_items_refined_mithril.png",
  "Refined Titanium": "SkyBlock_items_refined_titanium.png",
  "Refined Tungsten": "SkyBlock_items_refined_tungsten.png",
  "Refined Umber": "SkyBlock_items_refined_umber.png",
  "Ruby-Polished Drill Engine": "SkyBlock_items_ruby_polished_drill_engine.png",
  "Sapphire Cloak": "SkyBlock_items_sapphire_cloak.png",
  "Sapphire-Polished Drill Engine":
    "SkyBlock_items_sapphire_polished_drill_engine.png",
  "Starfall Seasoning": "SkyBlock_items_starfall_seasoning.png",
  "Titanium Artifact": "SkyBlock_items_titanium_artifact.png",
  "Titanium Belt": "SkyBlock_items_titanium_belt.png",
  "Titanium Cloak": "SkyBlock_items_titanium_cloak.png",
  "Titanium Gauntlet": "SkyBlock_items_titanium_gauntlet.png",
  "Titanium Necklace": "SkyBlock_items_titanium_necklace.png",
  "Titanium Relic": "SkyBlock_items_titanium_relic.png",
  "Titanium Ring": "SkyBlock_items_titanium_ring.png",
  "Titanium Talisman": "SkyBlock_items_titanium_talisman.png",
  "Titanium Tesseract": "SkyBlock_items_titanium_tesseract.png",
  "Tungsten Plate": "SkyBlock_items_tungsten_plate.png",
  "Umber Plate": "SkyBlock_items_umber_plate.png",
} as const satisfies Record<string, string>;

const OVERRIDE_IMAGE_MAP = {
  "Ammonite Pet": "SkyBlock_pets_ammonite.png",
  "Ankylosaurus Pet": "SkyBlock_pets_ankylosaurus.png",
  "Beacon II": "SkyBlock_items_enchanted_beacon.gif",
  "Beacon III": "SkyBlock_items_enchanted_beacon.gif",
  "Beacon IV": "SkyBlock_items_enchanted_beacon.gif",
  "Beacon V": "SkyBlock_items_enchanted_beacon.gif",
  "Bejeweled Handle": "SkyBlock_items_enchanted_stick.gif",
  "Blue Cheese Goblin Omelette":
    "SkyBlock_items_goblin_omelette_blue_cheese.png",
  "Boots Of Divan": "Minecraft_items_golden_boots.png",
  "Chestplate Of Divan": "Minecraft_items_golden_chestplate.png",
  Chisel: "Minecraft_items_armor_stand.png",
  "Divan's Drill": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Drill Motor": "SkyBlock_items_drill_engine.png",
  "Dwarven Geode": "SkyBlock_items_rock_gemstone.png",
  "Dwarven Metal Talisman": "SkyBlock_items_coin_talisman.png",
  "Fuel Canister": "SkyBlock_items_fuel_tank.png",
  "Gemstone Drill LT-522": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Glacite-Plated Chisel": "Minecraft_items_armor_stand.png",
  "Goblin Pet": "SkyBlock_pets_goblin.png",
  "Helmet Of Divan": "SkyBlock_items_divan_helmet.png",
  "Jasper Drill X": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Leggings Of Divan": "Minecraft_items_golden_leggings.png",
  "Mammoth Pet": "SkyBlock_pets_mammoth.png",
  "Mithril Drill SX-R226": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Mithril Drill SX-R326": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Mithril-Infused Fuel Tank": "SkyBlock_items_mithril_fuel_tank.png",
  "Mithril-Plated Drill Engine": "SkyBlock_items_mithril_drill_engine.png",
  "Mole Pet": "SkyBlock_pets_mole.png",
  "Pesto Goblin Omelette": "SkyBlock_items_goblin_omelette_pesto.png",
  "Penguin Pet": "SkyBlock_pets_penguin.png",
  "Perfect Chisel": "SkyBlock_items_enchanted_armor_stand.gif",
  "Portable Campfire": "Minecraft_items_furnace.png",
  "Power Crystal": "SkyBlock_items_enchanted_nether_star.gif",
  "Reinforced Chisel": "Minecraft_items_armor_stand.png",
  "Relic Of Power": "SkyBlock_items_power_relic.png",
  "Ruby Drill TX-15": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Scorched Topaz": "SkyBlock_items_hot_stuff.png",
  "Secret Railroad Pass": "SkyBlock_items_enchanted_paper.gif",
  "Skeleton Key": "Minecraft_items_tripwire_hook.png",
  "Spicy Goblin Omelette": "SkyBlock_items_goblin_omelette_spicy.png",
  "Spinosaurus Pet": "SkyBlock_pets_spinosaurus.png",
  "Sunny Side Goblin Omelette": "SkyBlock_items_goblin_omelette_sunny_side.png",
  "T-Rex Pet": "SkyBlock_pets_tyrannosaurus.png",
  "Titanium Drill DR-X355": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Titanium Drill DR-X455": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Titanium Drill DR-X555": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Titanium Drill DR-X655": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Titanium-Infused Fuel Tank": "SkyBlock_items_titanium_fuel_tank.png",
  "Titanium-Plated Drill Engine": "SkyBlock_items_titanium_drill_engine.png",
  "Topaz Drill KGR-12": "SkyBlock_items_enchanted_prismarine_shard.gif",
  "Topaz Rod": "Minecraft_items_fishing_rod.png",
  "Travel Scroll To The Dwarven Base Camp": "Minecraft_items_empty_map.png",
  "Travel Scroll To The Dwarven Forge": "Minecraft_items_empty_map.png",
  "Tungsten Key": "SkyBlock_items_enchanted_lever.gif",
  "Tungsten Regulator": "SkyBlock_items_tungsten_keychain.png",
  "Umber Key": "SkyBlock_items_enchanted_dead_bush.gif",
} as const satisfies Record<string, string>;

const IMAGE_MAP = new Map<string, ForgeItemImage>();

for (const [name, file] of Object.entries(DIRECT_IMAGE_MAP)) {
  IMAGE_MAP.set(name, makeImage(name, file));
}

for (const [name, file] of Object.entries(OVERRIDE_IMAGE_MAP)) {
  IMAGE_MAP.set(name, makeImage(name, file));
}

export function getForgeItemImage(name: string): ForgeItemImage | null {
  return IMAGE_MAP.get(name) ?? null;
}
