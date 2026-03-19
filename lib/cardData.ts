export type CardType = "pokemon" | "promo" | "checklist";

export type Card = {
  id: number;
  name: string;
  type: CardType;
  rarity: "common" | "rare" | "legendary" | "promo" | "checklist";
  frontImage: string;
  backImage: string;
};

// 🔥 helper functions for YOUR naming system
const getFront = (index: number) =>
  `/cards/front/Bandai_-_Carddass_-_green_${index}.jpg`;

const getBack = (index: number) =>
  `/cards/back/Bandai_-_Carddass_-_green_back_${index}.jpg`;

export const cardData: Card[] = [
  // 🔥 POKÉMON (1–151)
  ...[
    "Bulbasaur","Ivysaur","Venusaur","Charmander","Charmeleon","Charizard",
    "Squirtle","Wartortle","Blastoise","Caterpie","Metapod","Butterfree",
    "Weedle","Kakuna","Beedrill","Pidgey","Pidgeotto","Pidgeot","Rattata",
    "Raticate","Spearow","Fearow","Ekans","Arbok","Pikachu","Raichu",
    "Sandshrew","Sandslash","Nidoran♀","Nidorina","Nidoqueen","Nidoran♂",
    "Nidorino","Nidoking","Clefairy","Clefable","Vulpix","Ninetales",
    "Jigglypuff","Wigglytuff","Zubat","Golbat","Oddish","Gloom","Vileplume",
    "Paras","Parasect","Venonat","Venomoth","Diglett","Dugtrio","Meowth",
    "Persian","Psyduck","Golduck","Mankey","Primeape","Growlithe","Arcanine",
    "Poliwag","Poliwhirl","Poliwrath","Abra","Kadabra","Alakazam","Machop",
    "Machoke","Machamp","Bellsprout","Weepinbell","Victreebel","Tentacool",
    "Tentacruel","Geodude","Graveler","Golem","Ponyta","Rapidash","Slowpoke",
    "Slowbro","Magnemite","Magneton","Farfetch'd","Doduo","Dodrio","Seel",
    "Dewgong","Grimer","Muk","Shellder","Cloyster","Gastly","Haunter",
    "Gengar","Onix","Drowzee","Hypno","Krabby","Kingler","Voltorb",
    "Electrode","Exeggcute","Exeggutor","Cubone","Marowak","Hitmonlee",
    "Hitmonchan","Lickitung","Koffing","Weezing","Rhyhorn","Rhydon",
    "Chansey","Tangela","Kangaskhan","Horsea","Seadra","Goldeen","Seaking",
    "Staryu","Starmie","Mr. Mime","Scyther","Jynx","Electabuzz","Magmar",
    "Pinsir","Tauros","Magikarp","Gyarados","Lapras","Ditto","Eevee",
    "Vaporeon","Jolteon","Flareon","Porygon","Omanyte","Omastar","Kabuto",
    "Kabutops","Aerodactyl","Snorlax","Articuno","Zapdos","Moltres",
    "Dratini","Dragonair","Dragonite","Mewtwo","Mew"
  ].map((name, index) => {
    const id = index + 1;        // 1 → 151
    const fileIndex = index + 1; // matches your files

    const legendaryIds = [144, 145, 146, 150, 151];

    const rarity: Card["rarity"] = legendaryIds.includes(id)
      ? "legendary"
      : id % 10 === 0
      ? "rare"
      : "common";

    return {
      id,
      name,
      type: "pokemon" as const,
      rarity,
      frontImage: getFront(fileIndex),
      backImage: getBack(fileIndex),
    };
  }),

  // 🟢 PROMO (NO MORE ID 0 🚫)
  {
    id: 152,
    name: "Venusaur Town Map",
    type: "promo",
    rarity: "promo",
    frontImage: getFront(0), // uses file 0
    backImage: getBack(0),
  },

  // 🔵 CHECKLISTS
  {
    id: 153,
    name: "Pokédex Checklist 1",
    type: "checklist",
    rarity: "checklist",
    frontImage: getFront(152),
    backImage: getBack(152),
  },
  {
    id: 154,
    name: "Pokédex Checklist 2",
    type: "checklist",
    rarity: "checklist",
    frontImage: getFront(153),
    backImage: getBack(153),
  },
];