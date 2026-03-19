export type CardType = "pokemon" | "promo" | "checklist";
export type CardRarity =
  | "common"
  | "rare"
  | "legendary"
  | "promo"
  | "checklist";

export type Card = {
  id: number; // internal app/database id
  displayId: number; // shown in UI as 000–153
  name: string;
  type: CardType;
  rarity: CardRarity;
  frontImage: string;
  backImage: string;
};

// file names are 0-based in /public/cards/...
const getFront = (index: number) =>
  `/cards/front/Bandai_-_Carddass_-_green_${index}.jpg`;

const getBack = (index: number) =>
  `/cards/back/Bandai_-_Carddass_-_green_back_${index}.jpg`;

const pokemonNames = [
  "Bulbasaur",
  "Ivysaur",
  "Venusaur",
  "Charmander",
  "Charmeleon",
  "Charizard",
  "Squirtle",
  "Wartortle",
  "Blastoise",
  "Caterpie",
  "Metapod",
  "Butterfree",
  "Weedle",
  "Kakuna",
  "Beedrill",
  "Pidgey",
  "Pidgeotto",
  "Pidgeot",
  "Rattata",
  "Raticate",
  "Spearow",
  "Fearow",
  "Ekans",
  "Arbok",
  "Pikachu",
  "Raichu",
  "Sandshrew",
  "Sandslash",
  "Nidoran♀",
  "Nidorina",
  "Nidoqueen",
  "Nidoran♂",
  "Nidorino",
  "Nidoking",
  "Clefairy",
  "Clefable",
  "Vulpix",
  "Ninetales",
  "Jigglypuff",
  "Wigglytuff",
  "Zubat",
  "Golbat",
  "Oddish",
  "Gloom",
  "Vileplume",
  "Paras",
  "Parasect",
  "Venonat",
  "Venomoth",
  "Diglett",
  "Dugtrio",
  "Meowth",
  "Persian",
  "Psyduck",
  "Golduck",
  "Mankey",
  "Primeape",
  "Growlithe",
  "Arcanine",
  "Poliwag",
  "Poliwhirl",
  "Poliwrath",
  "Abra",
  "Kadabra",
  "Alakazam",
  "Machop",
  "Machoke",
  "Machamp",
  "Bellsprout",
  "Weepinbell",
  "Victreebel",
  "Tentacool",
  "Tentacruel",
  "Geodude",
  "Graveler",
  "Golem",
  "Ponyta",
  "Rapidash",
  "Slowpoke",
  "Slowbro",
  "Magnemite",
  "Magneton",
  "Farfetch'd",
  "Doduo",
  "Dodrio",
  "Seel",
  "Dewgong",
  "Grimer",
  "Muk",
  "Shellder",
  "Cloyster",
  "Gastly",
  "Haunter",
  "Gengar",
  "Onix",
  "Drowzee",
  "Hypno",
  "Krabby",
  "Kingler",
  "Voltorb",
  "Electrode",
  "Exeggcute",
  "Exeggutor",
  "Cubone",
  "Marowak",
  "Hitmonlee",
  "Hitmonchan",
  "Lickitung",
  "Koffing",
  "Weezing",
  "Rhyhorn",
  "Rhydon",
  "Chansey",
  "Tangela",
  "Kangaskhan",
  "Horsea",
  "Seadra",
  "Goldeen",
  "Seaking",
  "Staryu",
  "Starmie",
  "Mr. Mime",
  "Scyther",
  "Jynx",
  "Electabuzz",
  "Magmar",
  "Pinsir",
  "Tauros",
  "Magikarp",
  "Gyarados",
  "Lapras",
  "Ditto",
  "Eevee",
  "Vaporeon",
  "Jolteon",
  "Flareon",
  "Porygon",
  "Omanyte",
  "Omastar",
  "Kabuto",
  "Kabutops",
  "Aerodactyl",
  "Snorlax",
  "Articuno",
  "Zapdos",
  "Moltres",
  "Dratini",
  "Dragonair",
  "Dragonite",
  "Mewtwo",
  "Mew",
] as const;

export const cardData: Card[] = [
  // 000
  {
    id: 1,
    displayId: 0,
    name: "Venusaur Town Map",
    type: "promo",
    rarity: "promo",
    frontImage: getFront(0),
    backImage: getBack(0),
  },

  // 001–151
  ...pokemonNames.map((name, index) => {
    const id = index + 2; // internal ids 2..152
    const displayId = index + 1; // visible ids 001..151
    const fileIndex = index + 1; // file 1..151

    const legendaryDisplayIds = new Set([144, 145, 146, 150, 151]);

    let rarity: CardRarity = "common";
    if (legendaryDisplayIds.has(displayId)) {
      rarity = "legendary";
    } else if (displayId % 10 === 0) {
      rarity = "rare";
    }

    return {
      id,
      displayId,
      name,
      type: "pokemon" as const,
      rarity,
      frontImage: getFront(fileIndex),
      backImage: getBack(fileIndex),
    };
  }),

  // 152
  {
    id: 153,
    displayId: 152,
    name: "Pokédex Checklist 1",
    type: "checklist",
    rarity: "checklist",
    frontImage: getFront(152),
    backImage: getBack(152),
  },

  // 153
  {
    id: 154,
    displayId: 153,
    name: "Pokédex Checklist 2",
    type: "checklist",
    rarity: "checklist",
    frontImage: getFront(153),
    backImage: getBack(153),
  },
];