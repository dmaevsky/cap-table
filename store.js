import bootstrap from "~matyunya/store";

const testStore = {
  // date (Month Year), name, share price, conditions attached
  rounds: new Map([[
    0, // round id
    {
      name: "Founded",
      date: new Date("2014-08-01"),
      type: "founded",
      sharePrice: 1000,
      investments: new Set(), // set of tuples [investor_id, number of acquired shares]
    }
  ]]),

  // name, address, class, acquisition date, #shares,
  // position/relationship with shareholders, note(acquisition price,allocation to third party or purchase)
  investors: new Map([[0, { name: "Founder" }]]),
};

const testStoreWithRowSpan = {
  rounds: new Map([[
    0,
    {
      name: "Row span test Employee SO round",
      date: new Date("2022-08-01"),
      type: "employee",
      sharePrice: 1000,
      investments: new Set(),
    }
  ]]),
  investors: new Map([[0, { name: "Founder", group: "Founder" }], [1, { name: "Employee 1", group: "Employees" }]]),
};

const testStoreWithShareCalc = {
  rounds: new Map([[
    0,
    {
      name: "Founded",
      date: new Date("2014-08-01"),
      type: "founded",
      sharePrice: 1000,
      investments: new Set([[0, 3000]]),
    },
  ], [
    1,
    {
      name: "Row span test Employee SO round",
      date: new Date("2022-08-01"),
      type: "employee",
      sharePrice: 80000,
      investments: new Set([[0, 0], [1, 576]]),
    }
  ], [
    2,
    {
      name: "Angel round 1",
      date: new Date("2022-10-01"),
      type: "angel",
      sharePrice: 125000,
      investments: new Set([[0, 0], [1, 0], [2, 120], [3, 40]]),
    }
  ]
]),
  investors: new Map([
    [0, { name: "Founder", group: "Founder" }],
    [1, { name: "Employee", group: "Employees" }],
    [2, { name: "Angel 1", group: "Angels 1" }],
    [3, { name: "Angel 2", group: "Angels 1" }]
  ]),
};

export const basicStore = bootstrap(testStore);

export const storeWithRowSpan = bootstrap(testStoreWithRowSpan);

export const shareCalcStore = bootstrap(testStoreWithShareCalc);

export function UPDATE_SHARE({ roundId, investorId, shares }) {
  return ({ update }) => update('rounds', roundId, 'investors', i => {
    const updated = new Map(i || []);

    updated.set(investorId, shares);

    return updated;
  });
}
