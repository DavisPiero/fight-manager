// Screen-level state that isn't saved with the career.
export const UI = {
  view: "menu",
  last: "",
  pid: null,
  setup: { name: "", col: 0, diff: "Normal" },
  gym: { fid: null, area: "strike", key: "box", int: 1 },
  mk: { tab: "free", div: -1, q: "", sort: "ovr" },
  rk: 3,
  office: "fin",
  modal: null, // {kind, ...}
  speed: 1,
  FS: null, // current fight
  queue: [], // bookings still to fight this week
};
