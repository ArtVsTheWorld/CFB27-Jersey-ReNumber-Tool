// Candidate Generator: build an ordered list of jersey candidates
// for a player based on the position RULES (preferred & fallback).
import RULES from "./rules.js";

export function generateCandidates(player) {
    const rule = RULES[player.Position];
    if (!rule) return { candidates: [], fallbackStartIndex: 0 };

    const preferredCandidates = (rule.preferred ?? []).flat();
    const fallbackCandidates = (rule.fallback ?? []).flat();

    let legalNumbers = player.isPromotionAttempt ? [...rule.preferred[0]] : [...preferredCandidates, ...fallbackCandidates];
    if (player.isPromotionAttempt) legalNumbers = legalNumbers.filter(n => Math.abs(n - player.JerseyNum) > 2);

    const candidates = [];
    let favoredNumbers;
    const onesDigit = player.JerseyNum % 10;
    const tensDigit = Math.floor(player.JerseyNum / 10);

    if (player.Position === "DT") favoredNumbers = [90 + onesDigit, 90 + tensDigit];
    else favoredNumbers = [onesDigit, tensDigit, onesDigit + 10, tensDigit + 10];

    for (const number of favoredNumbers) if (legalNumbers.includes(number) && !candidates.includes(number)) candidates.push(number);
    for (const number of legalNumbers) if (!candidates.includes(number)) candidates.push(number);

    const fallbackStartIndex = player.isPromotionAttempt || !rule.fallback ? candidates.length : preferredCandidates.length;
    return { candidates, fallbackStartIndex };
}