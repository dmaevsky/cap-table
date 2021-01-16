import {
  UPDATE_SHARE,
  UPDATE_SHARE_PRICE,
  UPDATE_GROUP_NAME,
  REMOVE_GROUP,
  ADD_INVESTOR,
  RENAME_ROUND,
  UPDATE_JKISS_INVESTED,
  UPDATE_VALUATION_CAP,
  UPDATE_DISCOUNT,
  TOGGLE_PUBLIC,
  COPY_DOCUMENT,
  REMOVE_DOCUMENT,
  RESET_DOCUMENT,
  docId,
} from "./store.js";

import {
  firstColClasses,
  groupClasses,
} from "./classes.js";

import {
  totalShares,
  totalCommonShares,
  totalSharesForInvestor,
  totalCommonSharesForInvestor,
  totalVotingSharesForInvestor,
  format,
  getPosition,
  allGroups,
  lastInvestorIdInGroup,
  calcJkissShares,
  uid,
} from "./utils.js";

export function groupNames(investors) {
  const investorGroups = allGroups(investors);

  return investorGroups.reduce((acc, cur, i) => {
    if (investorGroups[i - 1] === cur) {
      return acc;
    }

    const y = i + 3 + acc.length;

    return [
      ...acc,
      // Three label rows
      [
        `group-label:${cur}:${i}`,
        {
          position: [y, 0, y, 1],
          value: cur,
          classes: groupClasses + " " + firstColClasses,
          onChange: (store, { value }) => {
            store.commit(UPDATE_GROUP_NAME, { oldName: cur, newName: value });
          },
          menuItems: (store, { id }) => [
            {
              text: "グループ追加",
              cb: () => {
                store.commit(
                  ADD_INVESTOR,
                  {
                    newGroup: true,
                    afterId: [...store.get('investors')].reduce(lastInvestorIdInGroup(id.split(':')[1]), "")
                  }
                )
              },
            },
            {
              text: "削除",
              cb: () => store.commit(REMOVE_GROUP, { group: id.split(':')[1] }),
            },
          ],
        }
      ],
    ];
  }, []);
}

const calcCell = calcFn =>
  prefix =>
  (investors, rounds, futureRounds, nextRoundResults, col, id, colSpan, ...options) =>
  ([investorId, { commonShares, votingShares, ...investment }]) => {
  return [
    `${prefix}:${id}:${investorId}`,
    {
      position: getPosition(investors, investorId, col, colSpan ? (colSpan - 1) : 0),
      value: calcFn({
        commonShares,
        votingShares,
        rounds,
        futureRounds,
        nextRoundResults,
        investors,
        investorId,
        ...investment
      }),
      ...options[0],
    }
  ];
};

const calcSharesPerRound = ({ rounds, investorId, futureRounds }) => {
  const total = totalCommonShares(rounds);
  const previousRoundShares = totalCommonSharesForInvestor(rounds, investorId, futureRounds);

  return previousRoundShares / total;
};

const calcTotalSharesPerRound = ({ rounds, investorId, futureRounds }) => {
  const total = totalShares(rounds, futureRounds);
  const previousRoundShares = totalSharesForInvestor(rounds, investorId, futureRounds);

  return previousRoundShares / total;
};

const calcCommonShares = ({ rounds, investorId, futureRounds }) => totalCommonSharesForInvestor(rounds, investorId, futureRounds);

const calcCommonVotingShares = ({ rounds, investorId }) => totalVotingSharesForInvestor(rounds, investorId);

const calcTotalShares = ({ rounds, investorId, futureRounds }) => totalSharesForInvestor(rounds, investorId, futureRounds);

const updateShares = type => (store, { id, value }) => {
  const [, roundId, investorId] = id.split(":");
  store.commit(UPDATE_SHARE, { roundId, investorId, shares: Number(value), type });
};

const updateInvestment = (mutation, fieldName) => (store, { id, value }) => {
  const [, roundId, investorId] = id.split(":");
  store.commit(mutation, { roundId, investorId, [fieldName]: Number(value) });
};

const updateJkissInvested = updateInvestment(UPDATE_JKISS_INVESTED, "jkissInvested");

const updateRound = (mutation, fieldName) => (store, { id, value }) => {
  const [roundId] = id.split(":");
  store.commit(mutation, { roundId, [fieldName]: value });
};

export const renameRound = updateRound(RENAME_ROUND, "name");
export const updateSharePrice = updateRound(UPDATE_SHARE_PRICE, "sharePrice");

const colTypes = {
  sharesInitial: {
    label: "株式数",
    onChange: updateShares("common"),
    fn: calcCell(({ commonShares }) => commonShares || 0)("initial"),
    format: format.number.format,
  },
  shareDiff: {
    label: "株式増減",
    onChange: updateShares("common"),
    fn: calcCell(({ commonShares }) => commonShares || 0)("diff"),
    format: format.number.format,
  },
  sharesAmount: {
    label: "株式数",
    fn: calcCell(calcCommonShares)("amount"),
    format: format.number.format,
  },
  sharesPercent: {
    label: "%",
    fn: calcCell(calcSharesPerRound)("percent"),
    format: format.percent.format,
  },
  votingShareDiff: {
    label: "株式増減",
    hasRowspan: true,
    classes: "dark:border-blue-800 border-blue-300 border-l",
    voting: true,
    fn: calcCell(({ votingShares }) => votingShares || 0)("voting-diff"),
    onChange: updateShares("voting"),
    format: format.number.format,
  },
  jkissShares: {
    label: "株式数",
    fn: calcCell(({ commonShares }) => commonShares || 0)("jkiss"),
    colSpan: 2,
    format: format.number.format,
  },
  jkissInvested: {
    label: "投資額",
    fn: calcCell(({ jkissInvested }) => jkissInvested || 0)("jkiss-invested"),
    colSpan: 2,
    format: format.currency.format,
    onChange: updateJkissInvested,
  },
  votingSharesAmount: {
    label: "株式数",
    hasRowspan: true,
    fn: calcCell(calcCommonVotingShares)("voting-total"),
    format: format.number.format,
  },
  totalSharesAmount: {
    label: "発行済株式数",
    fn: calcCell(calcTotalShares)("total-amount"),
    format: format.number.format,
  },
  totalSharesPercent: {
    label: "%",
    fn: calcCell(calcTotalSharesPerRound)("total-percent"),
    format: format.percent.format,
  },
};

const {
  sharesInitial,
  shareDiff,
  sharesAmount,
  sharesPercent,
  votingShareDiff,
  votingSharesAmount,
  totalSharesAmount,
  totalSharesPercent,
  jkissShares,
  jkissInvested,
} = colTypes;

const foundCols = [sharesInitial, sharesPercent];

const genericCols = [
  shareDiff,
  sharesAmount,
  sharesPercent,
  votingShareDiff,
  votingSharesAmount,
  totalSharesAmount,
  totalSharesPercent
];

const jkissCols = [
  jkissInvested,
  jkissShares,
];

export const roundOptions = {
  founded: {
    colSpan: foundCols.length,
    cols: foundCols,
  },
  common: {
    colSpan: genericCols.length,
    cols: genericCols,
  },
  "j-kiss": {
    colSpan: jkissCols.reduce((acc, cur) => acc + cur.colSpan, 0),
    cols: jkissCols,
  },
  split: {
    colSpan: genericCols.length,
    cols: genericCols,
  },
  preferred: {
    colSpan: genericCols.length,
    cols: genericCols,
  },
};

export const roundTypes = Object.keys(roundOptions);

export const togglePublic = (store) => {
  store.commit(TOGGLE_PUBLIC);
};

export const createDocument = (store, { from } = {}) => {
  const to = uid();
  store.commit(COPY_DOCUMENT, { from, to });

  // TODO: redirect
  docId.set(to);
}

export const resetDocument = (store) => {
  store.commit(RESET_DOCUMENT);
}

export const removeDocument = (store, { id }) => {
  const ids = [...store.get('documents').keys()];
  const idx = ids.indexOf(id);

  store.commit(REMOVE_DOCUMENT, { id });

  // TODO: redirect
  docId.set(ids[idx - 1]);
}
