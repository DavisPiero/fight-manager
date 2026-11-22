// Screen-level state that isn't saved with the career.
export const UI = {
  view: "menu",
  last: "",
  pid: null,
  setup: { slot: 1, name: "", manager: "", col: 0, diff: "Normal", city: "vegas", focus: "strike", emblem: "fist" },
  gym: { fid: null, area: "strike", key: "box", int: 1 },
  mk: { tab: "free", div: -1, q: "", sort: "ovr" },
  rk: 3,
  office: "sponsors",
  menuPage: "main", // "main" (Play / Settings) or "slots"
  modal: null, // {kind, ...}
  speed: 1,
  FS: null, // current fight
  queue: [], // bookings still to fight this week
  phone: { open: false, v: { app: "home" }, stack: [], seen: 0, pick: null },
};
