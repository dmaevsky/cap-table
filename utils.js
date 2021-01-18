import { groupClasses } from "./classes.js";

const reduceSumOfShares = (acc, { investments }) => acc + sum([...investments.values()].map(({ commonShares = 0, votingShares = 0 }) => commonShares + votingShares));

const reduceSumOfCommonShares = (acc, { investments }) => acc + sum([...investments.values()].map(({ commonShares = 0 }) => commonShares));

const reduceSumOfJkissInvested = (acc, { investments }) => acc + sum([...investments.values()].map(({ jkissInvested = 0 }) => jkissInvested));

export const uid = (length = 16) => [...Array(length)].map(() => (Math.random() * 16 | 0).toString(16)).join('');

export const calcShare = (myShare, total) => (myShare * 100 / total).toFixed(1);

export const sum = i => i.reduce((acc, cur) => acc + cur, 0);

export const lastInvestorIdInGroup = search => (res, [investorId, { group }]) => group === search ? investorId : res;

export const totalShares = (rounds) => rounds.size ? [...rounds.values()].reduce(reduceSumOfShares, 0) : 0;

export const totalCommonShares = (rounds) => rounds.size ? [...rounds.values()].reduce(reduceSumOfCommonShares, 0) : 0;

export const calcOffset = (cols, idx) => cols.slice(0, idx).reduce((acc, cur) => acc + (cur.colSpan || 1), 0);

export const totalCommonSharesForInvestor = (rounds, investorId) => [...rounds.values()]
  .reduce(
    (acc, { investments }) => acc + ((investments.get(investorId) || {}).commonShares || 0), 0);

export const totalVotingSharesForInvestor = (rounds, investorId) => [...rounds.values()]
  .reduce(
    (acc, { investments }) => acc + ((investments.get(investorId) || {}).votingShares || 0), 0);

export const totalSharesForInvestor = (rounds, investorId) => {
  return totalCommonSharesForInvestor(rounds, investorId) + totalVotingSharesForInvestor(rounds, investorId);
}

export const getPreviousRounds = (rounds, id) => {
  if (!id) return new Map([]);

  const idx = [...rounds.keys()].indexOf(id);

  return new Map([...rounds].slice(0, idx + 1));
}

export const getFutureRounds = (rounds, id) => {
  const idx = [...rounds.keys()].indexOf(id);

  return new Map([...rounds].slice(idx + 1));
}

export const calcJkissShares = ({ nextRoundResults, valuationCap = 0, jkissInvested = 0, discount = 100 }) => {
  if (!jkissInvested || !nextRoundResults) return 0;

  const { sharePrice, totalShares, preMoneyDiluted } = nextRoundResults;

  const jkissPrice = Math.min(sharePrice * discount / 100, (preMoneyDiluted - jkissInvested) / totalShares);

  return Math.floor(jkissInvested / jkissPrice);
}

export const format = {
  number: new Intl.NumberFormat("ja-JA"),
  percent: new Intl.NumberFormat("ja-JA", { style: "percent", minimumFractionDigits: 1, maximumFractionDigits: 1 }),
  currency: new Intl.NumberFormat("ja-JA", { style: "currency", currency: 'JPY' }),
};

export const allGroups = investors => [...investors.values()].map(i => i.group);

export const uniqueGroups = investors => new Set(allGroups(investors));

function calcGroupRow(investors, group) {
  const investorGroups = allGroups(investors);

  return investorGroups.reduce((acc, cur, i) => {
    if (typeof acc === "number") return acc;

    if (investorGroups[i - 1] === cur) {
      return acc;
    }

    const y = i + 3 + acc.length;

    if (cur === group) return y;

    return [
      ...acc,
      [cur, y],
    ];
  }, []);
}

export function getPosition(investors, id, x, colSpan = 0) {
  const { group } = investors.get(id);
  const y = calcGroupRow(investors, group);
  const idx = [...getGroupInvestors(investors, group).keys()].indexOf(id);

  return [y + idx + 1, x, y + idx + 1, x + colSpan];
}

export const totalInvestorRows = investors => investors.size + (new Set(allGroups(investors))).size;

export function calcRoundResults(r, id) {
  if (r.get(id).type === "j-kiss") return {};

  const rounds = new Map([...r].filter(([, { type }]) => type !== "j-kiss"));

  const roundIds = [...rounds.keys()];
  let prevId = roundIds[roundIds.indexOf(id) - 1];
  const round = rounds.get(id);

  const { sharePrice, type } = round;

  const prevRoundShares = totalCommonShares(getPreviousRounds(rounds, prevId)) || 0;
  const newEquity = reduceSumOfCommonShares(0, round) * sharePrice;
  const preMoney = sharePrice * prevRoundShares;

  const prevTotalRoundShares = totalShares(getPreviousRounds(rounds, prevId)) || 0;
  const newEquityDiluted = reduceSumOfShares(0, round) * sharePrice;
  const preMoneyDiluted = sharePrice * prevTotalRoundShares;

  return {
    sharePrice,
    newEquity: type === "split" ? 0 : newEquity,
    preMoney,
    postMoney: newEquity + preMoney,
    preMoneyDiluted,
    postMoneyDiluted: preMoneyDiluted + newEquityDiluted,
    totalShares: totalShares(rounds),
  };
}

function getAggregateValue(prefix, individualValues, x, y, colSpan, ...options) {
  const [idx] = individualValues[individualValues.length - 1] || [];

  if (!idx) return false;

  return [`${prefix}:${idx}`, {
    position: [y, x, y, x + (colSpan ? colSpan - 1 : 0)],
    value: individualValues.reduce((acc, [k, { value }]) => acc + value, 0),
    ...options[0],
  }];
}

const getGroupInvestors = (investors, group) => new Map([...investors].filter(([, i]) => i.group === group));

function fillEmptyInvestments(round, investors) {
  const investments = [...round.investments];
  const activeInvestorIds = [...round.investments.keys()];
  const inactiveInvestors = [...investors.keys()].filter(id => !activeInvestorIds.includes(id));

  return [...investments, ...inactiveInvestors.map(id => [id, { commonShares: 0, votingShares: 0 }])];
}

export const calcValues = ({
  prevCol,
  round,
  investors,
  id,
  previousRounds,
  futureRounds,
  nextRoundResults,
  cols,
}) => (acc, { onChange, fn, format, classes, colSpan }, i) => {
  if (!fn) return acc;

  const y = prevCol + calcOffset(cols, i) + 1;
  const investments = fillEmptyInvestments(round, investors);
  const individualValues = investments
    .map(fn(investors, previousRounds, futureRounds, nextRoundResults, y, id, colSpan, { onChange, format, classes }))
    .map(([id, val]) => [id, { ...val, disabled: round.type === "split" }]);

  const groups = [...uniqueGroups(investors)];

  const groupValues = groups.map(group => {
    const x = calcGroupRow(investors, group)
    const groupInvestors = getGroupInvestors(investors, group);
    const groupInvestorsValues = (investments.filter(([id]) => groupInvestors.has(id)) || [])
      .map(fn(groupInvestors, previousRounds, futureRounds, nextRoundResults, y, id, colSpan, { onChange, format, classes }));

    if (!groupInvestorsValues.length) return false;

    return getAggregateValue("group", groupInvestorsValues, y, x, colSpan, { format, classes: groupClasses + " " + classes });
  }).filter(Boolean);

  return [
    ...acc,
    ...individualValues,
    ...groupValues,

    getAggregateValue("total", individualValues, y, totalInvestorRows(investors) + 3, colSpan, { format, classes: groupClasses + " " + classes }),
  ].filter(Boolean);
}

const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

export const uniqueGroupName = investors => {
  const groups = uniqueGroups(investors);

  const unusedLetter = [...alpha].find(a => !groups.has("Group " + a));

  return "Group " + unusedLetter;
}

export function jkissRoundResults(rounds, id, x, y) {
  const roundIds = [...rounds.keys()];
  const prevId = roundIds[roundIds.indexOf(id) - 1];
  const nextId = roundIds[roundIds.indexOf(id) + 1];

  const { sharePrice } = rounds.get(prevId);
  const previousRounds = getPreviousRounds(rounds, prevId);
  const atInvestmentPreMoney = totalCommonShares(previousRounds) * sharePrice;
  const atInvestmentPreMoneyDiluted = totalShares(previousRounds) * sharePrice;
  const newEquity = [...(rounds.get(id).investments.values())].reduce((acc, { jkissInvested }) => acc + (jkissInvested || 0), 0);

  const jkissResultsAtInvestment = {
    sharePrice,
    newEquity,
    preMoney: atInvestmentPreMoney,
    postMoney: atInvestmentPreMoney + newEquity,
    preMoneyDiluted: atInvestmentPreMoneyDiluted,
    postMoneyDiluted: atInvestmentPreMoneyDiluted + newEquity,
  };

  if (!nextId) {
    return roundResultsWithPosition(id, x, y, 2, jkissResultsAtInvestment, true);
  }

  const nextRoundResults = calcRoundResults(rounds, nextId);

  const jkissResultsBeforeNextRound = {
    ...nextRoundResults,
    newEquity: 0,
    postMoney: nextRoundResults.preMoney,
    postMoneyDiluted: nextRoundResults.preMoneyDiluted,
  };

  return [
    ...roundResultsWithPosition(id, x, y, 2, jkissResultsAtInvestment, true),
    ...roundResultsWithPosition(id + "A", x + 2, y, 2, jkissResultsBeforeNextRound, true),
  ];
}

const convertSingleRoundToJkiss = rounds => ([id, round]) => {
  if (round.type !== "j-kiss") return [id, round];

  const roundIds = [...rounds.keys()];
  const nextId = roundIds[roundIds.indexOf(id) + 1];
  if (!nextId) return [id, round];

  const nextRoundResults = calcRoundResults(rounds, nextId);

  return [id, {
    ...round,
    investments: new Map([...round.investments].map(([id, investment]) => {
      if (!investment.jkissInvested) return [id, investment];

      return [id, {
        ...investment,
        commonShares: calcJkissShares({ nextRoundResults, ...investment, ...round }),
      }];
    })),
  }];
}

export function convertJkissToCommonShares(rounds) {
  return new Map([...rounds].map(convertSingleRoundToJkiss(rounds)));
}

export function roundResultsWithPosition(id, x, y, colSpan, roundResults, onChange = false) {
  return [
    [`${id}:share-price-label`, { value: roundResults.sharePrice, onChange }],
    [`${id}:new-equity-label`, { value: roundResults.newEquity }],
    [`${id}:pre-money-label`, { value: roundResults.preMoney }],
    [`${id}:post-money-label`, { value: roundResults.postMoney }],
    [`${id}:pre-money-label-diluted`, { value: roundResults.preMoneyDiluted }],
    [`${id}:post-money-label-diluted`, { value: roundResults.postMoneyDiluted }],
  ].map(([idx, val], i) => [
    idx,
    {
      ...val,
      format: format.currency.format,
      position: [y + i, x + 1, y + i, x + colSpan],
      classes: "text-center",
    }
  ]);
}
