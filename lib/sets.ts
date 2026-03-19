export type CardSet = {
  id: string;
  name: string;
  totalCards: number;
  coverImage: string;
  cardIds: number[];
};

export const sets: CardSet[] = [
  {
    id: "bandai-green",
    name: "Bandai Carddass Green",
    totalCards: 154,
    coverImage: "/cards/front/Bandai_-_Carddass_-_green_0.jpg",
    cardIds: Array.from({ length: 154 }, (_, i) => i + 1),
  },
];