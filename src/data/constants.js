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
  Brazil: ["Thiago Caio Rafael Mateus Bruno Lucas Gustavo Davi Rodrigo Felipe Vinicius Leandro Renan Henrique Diego Matheus Otavio Wellington Luan Igor Paulo Jefferson Kaique Emerson Arthur Wesley Fabricio Marcelo Joao Cristiano",
           "Almeida Rocha Barbosa Nunes Moraes Teixeira Cardoso Ribeiro Carvalho Gomes Martins Araujo Pinto Correia Monteiro Mendes Freitas Cavalcanti Duarte Batista Lacerda Siqueira Vasconcelos Peixoto Brandao Fontes Queiroz Campos Rezende Viana Tavares Medeiros Bezerra Coelho Farias Guimaraes Leal Sampaio Aguiar Prado"],
  USA: ["Cody Dalton Marcus Tyler Jalen Wyatt Devin Trey Brandon Austin Colton Dustin Garrett Isaiah Logan Tanner Darius Mason Hunter Caleb Andre Brody Kyle Travis Damon Nolan Jace Reggie Quentin Shane",
        "Brooks Hayes Mercer Whitfield Grant Carver Holloway Pruitt Sutton Bishop Calloway Harlan Merritt Vance Kincaid Boone Hollis Lancaster Pierce Ramsey Thornton Gaines Maddox Ellison Stroud Crawford Dempsey Talbot Haskins Fowler Langley Sheffield Winslow Briggs Garrison Yates Rhodes Mathers Booker Dunbar"],
  Russia: ["Magomed Rustam Abdul Shamil Ilyas Murat Zaur Ruslan Arsen Timur Akhmed Said Kamil Islam Rasul Aslan Dmitri Sergei Artem Nikita Gadzhi Ibragim Umar Khasan Alikhan Daud Tagir Yusup Ramazan Denis",
           "Ismailov Kurbanov Zaitsev Hasanov Gadzhiev Abdulaev Omarov Rasulov Magomedaliev Shikhsaidov Dzhabrailov Temirov Yakhyaev Saidov Bagautdinov Umarov Isaev Kadyrbekov Alibekov Tagirov Sorokin Kuznetsov Lebedev Morozov Novikov Fedorov Belov Orlov Gusev Tarasov Zhukov Nikitin Melnikov Kozlov Abakarov Murtazaliev Akhmedov Daudov Khalidov Batyrov"],
  Ireland: ["Declan Liam Callum Ryan Jack Owen Cian Rory Seamus Niall Eoin Darragh Padraig Ronan Tadhg Fionn Oisin Colm Shane Kieran Brendan Aidan Conor Diarmuid Cathal Donal Ciaran Killian Fergal Eamon",
            "Doyle Walsh Hughes Barrett Keane Fraser Quinn Byrne Gallagher Kavanagh Brennan Lynch Moran Flanagan Doherty Farrell Mulligan Gilmore Carey Kinsella Devlin Hennessy Sheridan Corrigan Dunne Lennon Tierney Costello Nolan McGrath Phelan Rafferty Cullinane Geraghty Halloran Duggan Foley Madden Egan Cassidy"],
  Mexico: ["Diego Emilio Santiago Alonso Mauricio Cristian Joaquin Adrian Ulises Ramiro Fernando Eduardo Leonel Hector Gerardo Arturo Ivan Rogelio Jesus Osvaldo Saul Esteban Marco Victor Rodolfo Tomas Andres Abel Gael Ignacio",
           "Herrera Ruiz Salazar Ortega Vega Castillo Navarro Ibarra Mendoza Cervantes Aguilar Fuentes Montoya Delgado Cordero Espinoza Rosales Villanueva Pacheco Trujillo Arellano Zamora Valdez Camacho Galindo Becerra Quintero Bautista Escobedo Solis Barajas Carrillo Avila Juarez Lozano Maldonado Robles Sandoval Tapia Urias"],
  Australia: ["Jake Mitch Noah Beau Kai Harry Lachlan Zac Riley Cooper Hamish Flynn Jarrah Corey Brodie Tom Lincoln Callan Bailey Archie Toby Declan Jett Marley Fraser Darcy Lockie Heath Kobe Angus",
              "Turner Nguyen Mason Kelly Reid Walker Fitzgerald Lowe Hargreaves Pascoe Sinclair Dwyer Bancroft Horsfield Kennedy Mackay Prentice Gillespie Ashworth Holt Wakefield Crowther Rennie Lister Mortimer Petrie Bramley Sexton Whitlock Ridley Haddon Cutler Pemberton Fenwick Stanfield Gorman Atherton Brierley Coles Tully"],
  Japan: ["Kenta Ryo Daiki Shoma Takumi Yuto Sora Haruki Kazuki Shota Ren Hayato Takeru Yusuke Kenji Riku Masato Tatsuya Kaito Naoki Shun Taiga Hiroto Ryota Kosuke Akira Yuki Sota Itsuki Genki",
          "Tanaka Ishida Kobayashi Endo Ueda Kimura Hayashi Matsumoto Nakamura Yoshida Yamaguchi Inoue Watanabe Saito Fujita Okada Hasegawa Murakami Kondo Ogawa Goto Aoki Fukuda Ota Miura Takeuchi Nishimura Kaneko Sakamoto Ikeda Ono Shimizu Sugiyama Arai Hirano Kudo Nomura Iwasaki Takagi Maeda"],
  Poland: ["Kamil Mateusz Piotr Bartosz Jakub Szymon Michal Oskar Lukasz Pawel Tomasz Krzysztof Adrian Dawid Marcin Wojciech Grzegorz Filip Hubert Igor Dominik Patryk Rafal Sebastian Maciej Damian Artur Przemek Kacper Wiktor",
           "Nowak Wojcik Kaczmarek Zielinski Mazur Wrobel Sikora Lewandowski Kaminski Wisniewski Dabrowski Pawlak Michalski Grabowski Jasinski Zawadzki Szczepanski Baran Kubiak Gorski Witkowski Rutkowski Ostrowski Walczak Stepien Malinowski Sobczak Czarnecki Bielecki Adamczyk Duda Laskowski Kowalczyk Sadowski Wilk Chmielewski Urbanski Borkowski Kalinowski Tomaszewski"],
  Nigeria: ["Tobi Chidi Emeka Femi Kunle Seun Ifeanyi Dayo Tunde Bayo Uche Obinna Chuka Kelechi Segun Jide Nnamdi Kayode Gbenga Ade Ikenna Somto Damilola Babatunde Chinedu Olumide Ebuka Tayo Wale Ayo",
            "Okafor Adeyemi Nwosu Balogun Eze Obi Okonkwo Adebayo Ogunleye Chukwu Afolabi Nnadi Oyelaran Bankole Ajayi Onyeka Akande Olawale Ibekwe Okoro Adewale Emenike Fashola Uzor Oduya Ikwuemesi Abiodun Nwachukwu Olaniyan Ekwueme Ogbonna Akinola Anozie Oyebanji Iwobi Okeke Adeleke Nwankwo Odukoya Mbah"],
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
export const SAVE_PREFIX = "fightmanager_slot_";
export const WEEKS_IN_RED_LIMIT = 6;
export const NO_SALE_WEEKS = 6; // can't flip a fighter within this many weeks of signing

// Where the agency is based. Bonus skills train 25% faster; cost scales weekly office costs.
export const CITIES = [
  { id: "vegas", name: "Las Vegas", country: "USA", nat: "USA", cost: 1.25, rep: 8, bonus: ["iq"], note: "Fight capital. Pricier, but you start with more reputation." },
  { id: "abq", name: "Albuquerque", country: "USA", nat: "USA", cost: 0.9, rep: 2, bonus: ["cardio", "dur"], note: "Altitude camp. Conditioning trains faster." },
  { id: "rio", name: "Rio de Janeiro", country: "Brazil", nat: "Brazil", cost: 0.8, rep: 0, bonus: ["bjj"], note: "Jiu-jitsu heartland. Cheap to run." },
  { id: "dag", name: "Makhachkala", country: "Russia", nat: "Russia", cost: 0.75, rep: 0, bonus: ["wres", "tdd"], note: "Wrestling factory. Cheapest office." },
  { id: "dublin", name: "Dublin", country: "Ireland", nat: "Ireland", cost: 1.0, rep: 4, bonus: ["box"], note: "Loud fans. Wins add extra popularity." },
  { id: "mex", name: "Mexico City", country: "Mexico", nat: "Mexico", cost: 0.85, rep: 2, bonus: ["box", "dur"], note: "Boxing culture. Tough, durable fighters." },
  { id: "syd", name: "Sydney", country: "Australia", nat: "Australia", cost: 1.05, rep: 3, bonus: ["kick"], note: "Kickboxing scene. Kicks train faster." },
  { id: "tokyo", name: "Tokyo", country: "Japan", nat: "Japan", cost: 1.1, rep: 3, bonus: ["thai", "iq"], note: "Technical striking. Fight IQ trains faster." },
];
export const FOCUS = {
  strike: { name: "Striking gym", keys: ["box", "kick", "thai"] },
  grapple: { name: "Grappling gym", keys: ["wres", "bjj", "tdd"] },
  cond: { name: "Strength & conditioning", keys: ["cardio", "dur"] },
};
export const EMBLEMS = {
  fist: '<path d="M7 11V7.5a1.5 1.5 0 013 0V6a1.5 1.5 0 013 0v.5a1.5 1.5 0 013 0V8a1.5 1.5 0 013 0v5c0 4-2.5 7-6.5 7h-1C7.7 20 5 17.6 5 14v-1.5A1.5 1.5 0 017 11z"/>',
  bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
  crown: '<path d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z"/>',
  shield: '<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>',
  star: '<path d="M12 2l3 6.5 7 .8-5.2 4.8 1.5 7L12 17.6 5.7 21l1.5-7L2 9.3l7-.8z"/>',
  flame: '<path d="M12 2c1 4 6 6 6 12a6 6 0 01-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z"/>',
};
// Fictional sponsors.
export const BRANDS = [
  { name: "Ironclad Nutrition", col: "#8b9bb4" }, { name: "Redline Energy", col: "#ff3b3b" }, { name: "Kodiak Apparel", col: "#c08a4a" },
  { name: "Northgate Watches", col: "#d8c48a" }, { name: "Titan Fightwear", col: "#9aa7ff" }, { name: "Bolt Hydration", col: "#43d6ff" },
  { name: "Summit Bank", col: "#5fd39a" }, { name: "Overtime Sportsbook", col: "#ffb347" }, { name: "Nightjar Headphones", col: "#c784ff" },
];
export const SLOTS = 3;
