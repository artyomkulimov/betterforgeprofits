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

const HYPIXEL_FALLBACK_IMAGE_MAP = {
  "Amber Crystal":
    "https://mc-heads.net/head/ef7835fc9e6daf632160e9b7ff378788a408064cc75ebf9f5158e615bdd59603/64",
  "Amethyst Crystal":
    "https://mc-heads.net/head/c4fc62cf4777abf3565a709852778e248aaae936fd5157c31db2a3c2470a665c/64",
  "Aquamarine Crystal":
    "https://mc-heads.net/head/867f374e98b0df0b9f4e340e10a614e5eae65b1ce1d032ba6fed17e372b4ac6/64",
  "Artifact Of Power":
    "https://mc-heads.net/head/2b15c8645bbabc42352350b1c9d84af71966c4c56a86d03acd079ed57f3ead3f/64",
  "Beacon I":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/beacon.png",
  "Blue Goblin Egg":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/spawn_egg.png",
  "Citrine Crystal":
    "https://mc-heads.net/head/48db71e3ac894d1678b7e13728b223d5dcb93242e4134720621ca6f891a4e6f/64",
  "Claw Fossil":
    "https://mc-heads.net/head/7c95c07bd0100f2d05cd6e9a8c8a835187e3139316befb4f3748c3e6859141fc/64",
  "Clubbed Fossil":
    "https://mc-heads.net/head/59039d22345de31ba1259b9ef80fb145ac6ae6492aaae2dd5a8ca4b9fb184c53/64",
  Coal: "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/coal.png",
  Cobblestone:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/cobblestone.png",
  Coins:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/gold_nugget.png",
  "Control Switch":
    "https://mc-heads.net/head/6ace5987fbcc9ffc5a36927986a57777c5a622223bb96214212b83c6375573a4/64",
  Corleonite:
    "https://mc-heads.net/head/df52e888b00dd5f3b82d6f9b89375c9e74bbba41d465860b0c09872873cb0f51/64",
  Diamond:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/diamond.png",
  "Divan Fragment":
    "https://mc-heads.net/head/633844f03c92d82503c9cd567a51fda47404fa53f216fad473f16ac83a97314f/64",
  "Divan's Alloy":
    "https://mc-heads.net/head/a865f344bf7c0fe170e84bc0a222bcb8ee741862531f4a3adf6bc93002387722/64",
  "Electron Transmitter":
    "https://mc-heads.net/head/ef4e7b91e452c3ee391a3f4b915f73d356b3ba3e3465e5ec786b495a98c83962/64",
  "Enchanted Coal":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/coal.png",
  "Enchanted Coal Block":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/coal_block.png",
  "Enchanted Cobblestone":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/cobblestone.png",
  "Enchanted Diamond":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/diamond.png",
  "Enchanted Diamond Block":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/diamond_block.png",
  "Enchanted Ender Pearl":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/ender_pearl.png",
  "Enchanted Glacite":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/ice_packed.png",
  "Enchanted Gold":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/gold_ingot.png",
  "Enchanted Gold Block":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/gold_block.png",
  "Enchanted Hard Stone":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/stone.png",
  "Enchanted Iron":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/iron_ingot.png",
  "Enchanted Iron Block":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/iron_block.png",
  "Enchanted Lapis Lazuli":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/dye_powder_blue.png",
  "Enchanted Mithril":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/prismarine_crystals.png",
  "Enchanted Redstone":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/redstone_dust.png",
  "Enchanted Redstone Block":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/redstone_block.png",
  "Enchanted Titanium":
    "https://mc-heads.net/head/3dcc0ec9873f4f8d407ba0a0f983e257787772eaf8784e226a61c7f727ac9e26/64",
  "Enchanted Tungsten":
    "https://mc-heads.net/head/2a441cb1941d32ad7dd255e057f2dd35299046caaa544be968e0b74d69f7199d/64",
  "Enchanted Umber":
    "https://mc-heads.net/head/2dfa531b18ae8227700dd2464987d72aaac160dd4a6c4f30067f2e5f1f2101e9/64",
  "Ender Pearl":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/ender_pearl.png",
  "Fine Amber Gemstone":
    "https://mc-heads.net/head/4b1cce22de19ed6727abc5e6c2d57864c871a44c956bbe2eb3960269b686b8b3/64",
  "Fine Amethyst Gemstone":
    "https://mc-heads.net/head/7a1ee5ffce04eb7da592d42414ff35e1bf38194d6b82e310dbc6261b47fb9c91/64",
  "Fine Aquamarine Gemstone":
    "https://mc-heads.net/head/2b822b9dc70b9ca20008c332f481cbebb52bd50669ca98a89fd33d1345fa10f2/64",
  "Fine Citrine Gemstone":
    "https://mc-heads.net/head/ec0ab9c9f35a1bf44de18a0db2aa0ed2ebe8b9faa820307da3638f36a8306536/64",
  "Fine Jade Gemstone":
    "https://mc-heads.net/head/b28f1c0c5092e12d33770df45c5845a9610886039b34abe93a16c5e942dfc8e4/64",
  "Fine Jasper Gemstone":
    "https://mc-heads.net/head/aac15f6fcf2ce963ef4ca71f1a8685adb97eb769e1d11194cbbd2e964a88978c/64",
  "Fine Onyx Gemstone":
    "https://mc-heads.net/head/787a326331fe27f7ee074f97727604c495f95c378121302e879e1f40ba4d20a8/64",
  "Fine Opal Gemstone":
    "https://mc-heads.net/head/ad798e20a47d251a9e33d40332973c7189ac1550760ba25c4b956c9159364568/64",
  "Fine Peridot Gemstone":
    "https://mc-heads.net/head/fcba7aefc1c4f412868739e2f2c2e651edeb1be25d3c7175e68a05b67506a1ed/64",
  "Fine Ruby Gemstone":
    "https://mc-heads.net/head/e672959028f274b379d430f068f0f15a4f793eac12afb94ae0b4e50cf895df0f/64",
  "Fine Sapphire Gemstone":
    "https://mc-heads.net/head/36161daa3589ec9c8187459ac36fd4dd2646c040678d3bfacb72a2210c6c801c/64",
  "Fine Topaz Gemstone":
    "https://mc-heads.net/head/92cb6e51c461e7359526bea5e06209cddde7c6469a819f3405cf0a038c159502/64",
  "Flawed Amber Gemstone":
    "https://mc-heads.net/head/173bcfc39eb85df1848535985214060a1bd1b3bb47defe4201476edc31671744/64",
  "Flawed Amethyst Gemstone":
    "https://mc-heads.net/head/71db59260895578d37e59505880602de940b088e5fff8da3e65201d739c86e84/64",
  "Flawed Aquamarine Gemstone":
    "https://mc-heads.net/head/e4166254ac8b324c1b78eadc7c249866c6742c17586a33aea6a89fe346b2acf0/64",
  "Flawed Citrine Gemstone":
    "https://mc-heads.net/head/dc0b8433579f480adc685748b2bf2eccc69221137f704bbb922614191f801b26/64",
  "Flawed Jade Gemstone":
    "https://mc-heads.net/head/82282c6bb8343e0f0d61ee0747dada75344f332e9ff0acaa3adcdf09321d3dd/64",
  "Flawed Jasper Gemstone":
    "https://mc-heads.net/head/a73511e504c316b139edb35febe73ef591c0f455e8caf9ee353bc12b6c14a922/64",
  "Flawed Onyx Gemstone":
    "https://mc-heads.net/head/352a91f44bcbc78d4c9d045e941a23f7bdb4d99609e60bdcec842396feb315a7/64",
  "Flawed Opal Gemstone":
    "https://mc-heads.net/head/eadc3bcdd7c701b63f8b8b4a96e429316a08388669d9a98c1a98791729b961df/64",
  "Flawed Peridot Gemstone":
    "https://mc-heads.net/head/75da734e63aa22116e64703bb33271c4fbc3d1332a6a60c24af49b804193bf46/64",
  "Flawed Ruby Gemstone":
    "https://mc-heads.net/head/46d81068cbdf4a364231a26453d6cd660a0095f9cd8795307c5be667427712e/64",
  "Flawed Sapphire Gemstone":
    "https://mc-heads.net/head/8a0af99e8d8703194a847a55268cf5ef4ac4eb3b24c0ed86551339d10b646529/64",
  "Flawed Topaz Gemstone":
    "https://mc-heads.net/head/b6392773d114be30aeb3c09c90cbe691ffeaceb399b530fe6fb53ddc0ced3714/64",
  "Flawless Amber Gemstone":
    "https://mc-heads.net/head/9dce62f70ac046b881113c6cf862987727774e265885501c9a245b180db08c0d/64",
  "Flawless Amethyst Gemstone":
    "https://mc-heads.net/head/d3623521c8111ad29e9dcf7acc56085a9ab07da732d1518976aee61d0b3e3bd6/64",
  "Flawless Aquamarine Gemstone":
    "https://mc-heads.net/head/d37699bdf8cb43eff147d9ce19b14802f9bc88a21e63ad28b669530e8a3c0b57/64",
  "Flawless Citrine Gemstone":
    "https://mc-heads.net/head/f06b4f63d3d3a39c98565af4858a5135be774ad672eb236bb65adfc8cb3425e8/64",
  "Flawless Jade Gemstone":
    "https://mc-heads.net/head/f89f75e0b00378a583dbba728dcdc6e9346f31dd601d448f3d60615c7465cc3e/64",
  "Flawless Jasper Gemstone":
    "https://mc-heads.net/head/ff993d3a43d40597b474485976160d0cf52ac64d157307d3b1c941db224d0ac6/64",
  "Flawless Onyx Gemstone":
    "https://mc-heads.net/head/1ca9b2841f71ba6fc4d6d2e97e80c1801f36ca3958e5a9a81a4f8785f6434367/64",
  "Flawless Opal Gemstone":
    "https://mc-heads.net/head/5d15ed70e720040ad7311e69359dfdf5e114eadd2a4c1f971a9501341a45264b/64",
  "Flawless Peridot Gemstone":
    "https://mc-heads.net/head/1884a8dcb7128341ce09cb3616c11c3e46f80d083a6f2dbb4dbe0bb932318b09/64",
  "Flawless Ruby Gemstone":
    "https://mc-heads.net/head/926a248fbbc06cf06e2c920eca1cac8a2c96164d3260494bed142d553026cc6/64",
  "Flawless Sapphire Gemstone":
    "https://mc-heads.net/head/957cfa9c75ba584645ee2af6d9867d767ddea4667cdfc72dc1061dd1975ca7d0/64",
  "Flawless Topaz Gemstone":
    "https://mc-heads.net/head/d10964f3c479ad7d9afaf68a42cab7c107d2d884f575cae2f070ec6f935b3be/64",
  "Footprint Fossil":
    "https://mc-heads.net/head/f2ae34c4927c02bfcc053420eff1689016f11890ce55fa6dd8af33c2a712dc84/64",
  "FTX 3070":
    "https://mc-heads.net/head/765984f037f1231b4067068f62507d77c93d017f872890cdd53e8c1e2f099a15/64",
  Glacite:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/ice_packed.png",
  "Glacite Jewel":
    "https://mc-heads.net/head/e80e2c206f06b4163dee678162b2d7a3ed6b20c6419fec44f91f6dd001a12a39/64",
  Glass:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/glass.png",
  "Glossy Gemstone":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/dye_powder_purple.png",
  "Goblin Egg":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/spawn_egg.png",
  "Gold Ingot":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/gold_ingot.png",
  "Green Goblin Egg":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/spawn_egg.png",
  "Hard Stone":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/stone.png",
  "Helix Fossil":
    "https://mc-heads.net/head/8177617f51c12f2ca1f561c50eb37b8ba751f2d621992ce3d3ec8f1743913de1/64",
  "Iron Ingot":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/iron_ingot.png",
  "Jade Crystal":
    "https://mc-heads.net/head/8b1eac429000eb2c418be46ea06acdefed4b7053a00e3e7f11272830068f21/64",
  "Jasper Crystal":
    "https://mc-heads.net/head/e2b5fe9ea52395a41ac68c0cb575864feb5fdd8ea158262e8f829125ec33d487/64",
  "Lapis Lazuli":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/dye_powder_blue.png",
  "Magma Core":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/magma_cream.png",
  "Match-Sticks":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/blocks/redstone_torch_on.png",
  Mithril:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/prismarine_crystals.png",
  "Onyx Crystal":
    "https://mc-heads.net/head/d3ad41e1227077261e45b2d28bdd7754d34e1d20e499e1ca7e4f9008f2c39f34/64",
  "Opal Crystal":
    "https://mc-heads.net/head/e3264c09099fb2532f58e59b91d9f10fbffc0b270a7ec38833e82ac9d17c84be/64",
  "Peridot Crystal":
    "https://mc-heads.net/head/bd29946829fda8f487cab583596992dd15ebea1ac91289fac6bb285ec90ea146/64",
  Plasma:
    "https://mc-heads.net/head/75aa8332bbec4a958fea2be64b8f1682f5d8247451aa2b7569edd0498437d706/64",
  "Precursor Apparatus":
    "https://mc-heads.net/head/81e70d3935701fa0e129bb6aa065616531013ccd9b6e00acec570aeea3ef5052/64",
  "Red Goblin Egg":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/spawn_egg.png",
  Redstone:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/redstone_dust.png",
  "Refined Mineral":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/dye_powder_brown.png",
  "Ring Of Power":
    "https://mc-heads.net/head/4528fe5dbe02e1d8d12186e2af98be1334ca7d596b7021ef7f978c7088b235fc/64",
  "Robotron Reflector":
    "https://mc-heads.net/head/1cd87c7af039ef4b2c7a37e6b94d9eeda22d2a5d2df43804ffca9e486a4eca15/64",
  "Rough Amber Gemstone":
    "https://mc-heads.net/head/da19436f6151a7b66d65ed7624add4325cfbbc2eee815fcf76f4c29ddf08f75b/64",
  "Rough Amethyst Gemstone":
    "https://mc-heads.net/head/e493c6f540c7001fed97b07f6b4c89128e3a7c37563aa223f0acca314f175515/64",
  "Rough Aquamarine Gemstone":
    "https://mc-heads.net/head/5a58a38f77b5f0f3610b164da29e901661b4628a482d5f702b71054f665e352c/64",
  "Rough Citrine Gemstone":
    "https://mc-heads.net/head/50e8517b3014e783556da47b17be931501b09da5bf8889b797ec087a8749a89/64",
  "Rough Jade Gemstone":
    "https://mc-heads.net/head/3b4c2afd544d0a6139e6ae8ef8f0bfc09a9fd837d0cad4f5cd0fe7f607b7d1a0/64",
  "Rough Jasper Gemstone":
    "https://mc-heads.net/head/23d064ec150172d05844c11a18619c1421bbfb2ddd1dbb87cdc10e22252b773b/64",
  "Rough Onyx Gemstone":
    "https://mc-heads.net/head/c04d7b3d11143da776c25b85c0d3f4c2ba1c99ff57aea4e34b808002db7f39e9/64",
  "Rough Opal Gemstone":
    "https://mc-heads.net/head/a14d3c57f80824b3839b8b220f2158bca505d497fd1c9e3f29f422b1e6206a45/64",
  "Rough Peridot Gemstone":
    "https://mc-heads.net/head/23c2b194d38922e493cfaf276d68f6f9ba0c0cd3a645bf2a06dc51424ea622d7/64",
  "Rough Ruby Gemstone":
    "https://mc-heads.net/head/d159b03243be18a14f3eae763c4565c78f1f339a8742d26fde541be59b7de07/64",
  "Rough Sapphire Gemstone":
    "https://mc-heads.net/head/cfcebe54dbc345ea7e22206f703e6b33befbe95b6a918bd1754b76188bc65bb5/64",
  "Rough Topaz Gemstone":
    "https://mc-heads.net/head/3fd960722ec29c66716ae5ca97b9b6b2628984e1d6f9d2592cd089914206a1b/64",
  "Ruby Crystal":
    "https://mc-heads.net/head/21dbe30b027acbceb612563bd877cd7ebb719ea6ed1399027dcee58bb9049d4a/64",
  "Sapphire Crystal":
    "https://mc-heads.net/head/150649626c4101352c5995c53b48bff60a938212b7ce902415feb76ea273b35f/64",
  "Shattered Locket":
    "https://mc-heads.net/head/d185a3ddade2cdadf404c91457331764fadc920a2142197f995910686e8bd688/64",
  "Sludge Juice":
    "https://mc-heads.net/head/e01ce68842074dde053185b218e34ee3259cb36ac471d80998f9cb01f32e51c7/64",
  "Spine Fossil":
    "https://mc-heads.net/head/a08ac18000d7a3d1b76ce8926a48c22f25289ff04ab79bf7cfa142f3f0713cab/64",
  Starfall:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/nether_star.png",
  Stick:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/stick.png",
  Sulphur:
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/glowstone_dust.png",
  "Superlite Motor":
    "https://mc-heads.net/head/5bb48bcc819277438a986f55813b05fe910f9de226b9cd257682674a8aadc43a/64",
  "Synthetic Heart":
    "https://mc-heads.net/head/6bc0f647b4769df300001b0294d99b02900dfdc9a74505017ec29a8719170113/64",
  "Talisman Of Power":
    "https://mc-heads.net/head/c6736fd95d3a6a4aaac46709a07aec7f1c38f0a3aae573e6f483388819412b65/64",
  Titanium:
    "https://mc-heads.net/head/6ef75235435d140042c8c4948e3f4c9a93daab1403439081124a9c391113d9bc/64",
  "Topaz Crystal":
    "https://mc-heads.net/head/449a6d330465bc94d573716428dc662cc16acd3b80535b52028c665f4daf682e/64",
  Treasurite:
    "https://mc-heads.net/head/be261c6b852dd38e0d51349b1b8132887cd1b69da04d8daf0121af79ad8dd92/64",
  Tungsten:
    "https://mc-heads.net/head/d811f3e723bbd46393f8aad8556b1df8ed33f559be827f47fe736f704c35586e/64",
  "Tusk Fossil":
    "https://mc-heads.net/head/c51b8d54d9444067f73aa6abf6fce97e92cc29eff4a67ecd5168ad17be240764/64",
  "Ugly Fossil":
    "https://mc-heads.net/head/6dbb286381d8a5a2d99e129feb2776530e4c31335f709fcd3e4baa6aeb5cbeda/64",
  Umber:
    "https://mc-heads.net/head/b565b5aa83d4aa7f7af22dc1271b2f0b27441f9ac1495f6b4653cf68dfb105ef/64",
  "Webbed Fossil":
    "https://mc-heads.net/head/e2c0fa30d7f4acd12a5f070a6f7f95a77f86068c2245878f99a2f6b3f8fbf63/64",
  "Worm Membrane":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/rotten_flesh.png",
  "Yellow Goblin Egg":
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets/1.8.9/assets/minecraft/textures/items/spawn_egg.png",
} as const satisfies Record<string, string>;

const IMAGE_MAP = new Map<string, ForgeItemImage>();

for (const [name, file] of Object.entries(DIRECT_IMAGE_MAP)) {
  IMAGE_MAP.set(name, makeImage(name, file));
}

for (const [name, file] of Object.entries(OVERRIDE_IMAGE_MAP)) {
  IMAGE_MAP.set(name, makeImage(name, file));
}

for (const [name, src] of Object.entries(HYPIXEL_FALLBACK_IMAGE_MAP)) {
  IMAGE_MAP.set(name, {
    alt: name,
    src,
  });
}

export function getForgeItemImage(name: string): ForgeItemImage | null {
  return IMAGE_MAP.get(name) ?? null;
}
