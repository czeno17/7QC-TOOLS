import { formatStat } from "@/lib/stats/descriptive";

const SPC_CONSTANTS: Record<number, [number, number, number]> = {
  2: [1.88, 0, 3.267],
  3: [1.023, 0, 2.574],
  4: [0.729, 0, 2.282],
  5: [0.577, 0, 2.114],
  6: [0.483, 0, 2.004],
  7: [0.419, 0.076, 1.924],
  8: [0.373, 0.136, 1.864],
  9: [0.337, 0.184, 1.816],
  10: [0.308, 0.223, 1.777],
};

type RuleKey = "rule1" | "rule2" | "rule3" | "rule4" | "rule5";
type RunRules = Record<RuleKey, number[]>;

function westernElectric(points: number[], centerLine: number, sigma: number): RunRules {
  const rules: RunRules = { rule1: [], rule2: [], rule3: [], rule4: [], rule5: [] };
  if (sigma <= 0) return rules;

  const upper3 = centerLine + 3 * sigma;
  const lower3 = centerLine - 3 * sigma;
  const upper2 = centerLine + 2 * sigma;
  const lower2 = centerLine - 2 * sigma;
  const upper1 = centerLine + sigma;
  const lower1 = centerLine - sigma;
  for (let index = 0; index < points.length; index++) {
    if (points[index] > upper3 || points[index] < lower3) rules.rule1.push(index);
  }
  for (let start = 0; start <= points.length - 3; start++) {
    const window = points.slice(start, start + 3);
    if (window.filter(value => value > upper2).length >= 2 || window.filter(value => value < lower2).length >= 2) rules.rule2.push(start);
  }
  for (let start = 0; start <= points.length - 5; start++) {
    const window = points.slice(start, start + 5);
    if (window.filter(value => value > upper1).length >= 4 || window.filter(value => value < lower1).length >= 4) rules.rule3.push(start);
  }
  for (let start = 0; start <= points.length - 7; start++) {
    const window = points.slice(start, start + 7);
    if (window.every(value => value > centerLine) || window.every(value => value < centerLine)) rules.rule4.push(start);
  }
  for (let start = 0; start <= points.length - 6; start++) {
    const window = points.slice(start, start + 6);
    const increasing = window.every((value, index) => index === 0 || value > window[index - 1]);
    const decreasing = window.every((value, index) => index === 0 || value < window[index - 1]);
    if (increasing || decreasing) rules.rule5.push(start);
  }
  return rules;
}

export function computeControlChart(subgroups: number[][]) {
  const sampleSize = subgroups[0]?.length ?? 0;
  const nUse = Math.min(10, Math.max(2, sampleSize));
  const constants = SPC_CONSTANTS[nUse];
  if (!constants || subgroups.length < 2) return null;

  const [a2, d3, d4] = constants;
  const means = subgroups.map(group => group.reduce((sum, value) => sum + value, 0) / group.length);
  const ranges = subgroups.map(group => Math.max(...group) - Math.min(...group));
  const xbarbar = means.reduce((sum, value) => sum + value, 0) / means.length;
  const rbar = ranges.reduce((sum, value) => sum + value, 0) / ranges.length;
  const uclX = xbarbar + a2 * rbar;
  const lclX = xbarbar - a2 * rbar;
  const uclR = d4 * rbar;
  const lclR = d3 * rbar;
  const sigmaX = (a2 * rbar) / 3;
  const rules = westernElectric(means, xbarbar, sigmaX);
  const flagged = new Set<number>();
  const flagReasons: Record<number, RuleKey[]> = {};
  const spans: Record<RuleKey, number> = { rule1: 1, rule2: 3, rule3: 5, rule4: 7, rule5: 6 };

  (Object.keys(rules) as RuleKey[]).forEach(rule => {
    rules[rule].forEach(start => {
      for (let offset = 0; offset < spans[rule]; offset++) {
        const index = start + offset;
        flagged.add(index);
        const reasons = flagReasons[index] ?? [];
        if (!reasons.includes(rule)) reasons.push(rule);
        flagReasons[index] = reasons;
      }
    });
  });

  const outR = ranges.map(value => value > uclR || value < lclR);
  const ruleLabels: Record<RuleKey, string> = {
    rule1: "1 beyond 3σ",
    rule2: "2 of 3 beyond 2σ",
    rule3: "4 of 5 beyond 1σ",
    rule4: "7 same side of CL",
    rule5: "6 trending",
  };
  const activeRules = (Object.keys(rules) as RuleKey[])
    .filter(rule => rules[rule].length > 0)
    .map(rule => `${ruleLabels[rule]} (${rules[rule].length})`);
  const flaggedCount = flagged.size;
  const interpretation = flaggedCount === 0
    ? `All ${subgroups.length} subgroups pass the Western Electric run rules (UCL ${formatStat(uclX, 3)} / LCL ${formatStat(lclX, 3)} on X̄; UCL ${formatStat(uclR, 3)} on R). The process appears stable and in statistical control — common-cause variation only.`
    : `${flaggedCount} point(s) flagged by run rules. Active patterns: ${activeRules.join("; ")}. This signals special-cause variation — investigate before drawing capability conclusions.`;

  return {
    subgroups,
    sampleSize,
    sameSize: subgroups.every(group => group.length === sampleSize),
    means,
    ranges,
    xbarbar,
    rbar,
    sigmaX,
    uclX,
    lclX,
    uclR,
    lclR,
    rules,
    flaggedCount,
    flagged: means.map((_, index) => flagged.has(index)),
    flagReasons,
    outR,
    interpretation,
  };
}
