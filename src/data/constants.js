export const DIVISIONS = ["Flyweight", "Bantamweight", "Featherweight", "Lightweight", "Welterweight", "Middleweight", "Light Heavyweight", "Heavyweight"];
export const DIV_SHORT = ["Fly", "Bantam", "Feather", "Light", "Welter", "Middle", "Light Heavy", "Heavy"];

export const ATTR_KEYS = ["box", "kick", "thai", "wres", "bjj", "tdd", "cardio", "dur", "iq"];
export const ATTR_NAMES = ["Boxing", "Kickboxing", "Muay Thai", "Wrestling", "Jiu-Jitsu", "Takedown D", "Cardio", "Durability", "Fight IQ"];
export const ATTR_SHORT = ["Box", "Kick", "Thai", "Wrestle", "BJJ", "TD def", "Cardio", "Chin", "IQ"];
export const ATTR_DESC = {
  box: "Punch accuracy and power on the feet.",
  kick: "Kicks and knees. Damage at range.",
  thai: "Clinch, knees and elbows. Adds strike variety.",
  wres: "Lands takedowns and holds top position.",
  bjj: "Submission threat and escapes from the bottom.",
  tdd: "Stops opponents dragging the fight to the mat.",
  cardio: "Slows fatigue so skills hold up in later rounds.",
  dur: "Absorbs damage and lowers knockout risk.",
  iq: "Reads exchanges and defends smarter.",
};
export const GYM_AREAS = [
  { id: "strike", name: "Striking", icon: "glove", keys: ["box", "kick", "thai"] },
  { id: "grapple", name: "Grappling", icon: "mat", keys: ["wres", "bjj", "tdd"] },
  { id: "cond", name: "Conditioning", icon: "heart", keys: ["cardio", "dur"] },
  { id: "mind", name: "Film room", icon: "brain", keys: ["iq"] },
];
export const INTENSITY = [
  { name: "Light", cost: 300, energy: 12, prep: 8, gain: 1, risk: "Low injury risk" },
  { name: "Normal", cost: 500, energy: 20, prep: 12, gain: 1.6, risk: "Balanced" },
  { name: "Hard", cost: 800, energy: 32, prep: 18, gain: 2.6, risk: "Injury risk when tired" },
];

export const PERSONALITIES = {
  Easygoing: "Happy with any reasonable deal.",
  Ambitious: "Wants big fights. Prefers short contracts.",
  Demanding: "Expects a bigger signing bonus.",
  Inconsistent: "Performance swings from fight to fight.",
  Loyal: "Likes long contracts and renews easily.",
  Hotheaded: "Fights aggressively, takes risks.",
  Professional: "Trains well and rarely gets hurt.",
};

export const STYLES = {
  Boxer: [10, 2, 0, -6, -6, 0, 0, 0, 4],
  Kickboxer: [3, 10, 4, -8, -8, 0, 0, 0, 2],
  Wrestler: [-8, -6, -4, 12, 4, 10, 4, 2, 0],
  Grappler: [-6, -6, -4, 4, 14, 4, 2, 0, 2],
  "Muay Thai": [0, 5, 12, -4, -6, 2, 2, 3, 2],
  "Well-rounded": [2, 2, 2, 2, 2, 2, 2, 2, 2],
};

export const NAMES = {
  Brazil: ["Thiago Caio Rafael Mateus Bruno Lucas Gustavo Davi", "Silva Costa Almeida Rocha Barbosa Nunes Moraes Teixeira"],
  USA: ["Cody Dalton Marcus Tyler Jalen Wyatt Devin Trey", "Brooks Hayes Mercer Cole Dawson Reyes Whitfield Grant"],
  Russia: ["Magomed Rustam Abdul Shamil Ilyas Murat Zaur Ruslan", "Ismailov Kurbanov Zaitsev Volkov Petrov Hasanov Aliev Gadzhiev"],
  Ireland: ["Declan Liam Callum Ryan Jack Owen Cian Rory", "Doyle Walsh Hughes Barrett Keane Fraser Quinn Byrne"],
  Mexico: ["Diego Emilio Santiago Alonso Mauricio Cristian Joaquin Adrian", "Herrera Ruiz Salazar Ortega Vega Castillo Navarro Ibarra"],
  Australia: ["Jake Mitch Noah Beau Kai Harry Lachlan Zac", "Turner Nguyen Mason Kelly Reid Walker Fitzgerald Lowe"],
  Japan: ["Kenta Ryo Daiki Shoma Takumi Yuto Sora Haruki", "Sato Tanaka Mori Ishida Kobayashi Endo Ueda Kimura"],
  Poland: ["Kamil Mateusz Piotr Bartosz Jakub Szymon Michal Oskar", "Nowak Wojcik Kaczmarek Zielinski Mazur Krol Wrobel Sikora"],
  Nigeria: ["Tobi Chidi Emeka Femi Kunle Seun Ifeanyi Dayo", "Okafor Adeyemi Nwosu Balogun Eze Obi Okonkwo Adebayo"],
};

// Rival agencies are fictional.
export const AGENCIES = [
  { id: 0, name: "Apex Sports Group", short: "APX", col: "#4c8dff", style: "big spender" },
  { id: 1, name: "Iron Circle Management", short: "ICM", col: "#9b6cff", style: "bargain hunter" },
  { id: 2, name: "Blackline MMA", short: "BLK", col: "#8b92a0", style: "steady" },
  { id: 3, name: "Summit Fight Partners", short: "SFP", col: "#3ecf8e", style: "loves prospects" },
  { id: 4, name: "Northstar Athletes", short: "NSA", col: "#f2b33d", style: "chases champions" },
  { id: 5, name: "Kingsway Combat", short: "KWC", col: "#ff7a45", style: "steady" },
];

export const AGENCY_COLOURS = ["#e1262d", "#f2b33d", "#4c8dff", "#3ecf8e", "#9b6cff", "#ff7a45"];
export const DIFFICULTY = {
  Easy: { cash: 400000, label: "$400k start, forgiving market" },
  Normal: { cash: 250000, label: "$250k start" },
  Hard: { cash: 120000, label: "$120k start, tough negotiators" },
};
export const ROSTER_MAX = 8;
export const SAVE_KEY = "fightmanager_v1";
export const WEEKS_IN_RED_LIMIT = 6;
export const NO_SALE_WEEKS = 6; // can't flip a fighter within this many weeks of signing
