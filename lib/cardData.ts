export type CardType = "pokemon" | "promo" | "checklist";

export type Card = {
  id: number;
  name: string;
  type: CardType;
  rarity: "common" | "rare" | "legendary" | "promo" | "checklist";
  image: string;
};

export const cardData: Card[] = [
  // 🟢 PROMO
  {
    id: 0,
    name: "Venusaur Town Map",
    type: "promo",
    rarity: "promo",
    image: "/cards/0.png",
  },

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
    const id = index + 1;

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
      image: `/cards/${id}.png`,
    };
  }),

  // 🔵 CHECKLIST
  {
    id: 152,
    name: "Pokédex Checklist 1",
    type: "checklist",
    rarity: "checklist",
    image: "/cards/152.png",
  },
  {
    id: 153,
    name: "Pokédex Checklist 2",
    type: "checklist",
    rarity: "checklist",
    image: "/cards/153.png",
  },
];