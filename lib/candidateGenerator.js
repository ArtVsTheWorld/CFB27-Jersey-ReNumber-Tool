// ==========================================
// Candidate Generator
//
// Returns jersey numbers in the order they
// should be attempted.
//
// This file does NOT care whether another
// player already owns a number.
//
// It simply builds a preference list.
// ==========================================

const RULES = require("./rules");

// ==========================================
// Expand a list of ranges into individual
// jersey numbers.
//
// Example:
//
// [[0,19],[80,89]]
//
// becomes
//
// [0,1,2...19,80...89]
//
// ==========================================

function expandRanges(ranges) {

    const numbers = [];

    for (const [min, max] of ranges) {

        for (let n = min; n <= max; n++) {
            numbers.push(n);
        }

    }

    return numbers;

}

// ==========================================
// Returns true if this player is wearing a
// jersey from the secondary legal range.
//
// Examples:
//
// HB   20-35
// MLB  40-58
// CB   20-29
//
// Used to determine whether candidate
// generation should focus on promotion
// numbers.
// ==========================================

function isSecondaryRange(player, rule) {
    if (rule.preferred.length < 2) return false;

    const [min, max] = rule.preferred[1];
    return player.JerseyNum >= min && player.JerseyNum <= max;
}

function generateCandidates(player) {

    const rule = RULES[player.Position];

    if (!rule)
        return [];

    // ----------------------------------
    // Determine which jersey numbers
    // should be considered.
    //
    // Normally we use every legal number.
    //
    // If this player is eligible for a
    // promotion attempt, only consider the
    // preferred range (the first preferred
    // range).
    // ----------------------------------

    const preferredCandidates = expandRanges(rule.preferred);
    const fallbackCandidates = rule.fallback ? expandRanges(rule.fallback) : [];

    let legalNumbers = player.isPromotionAttempt
        ? expandRanges([rule.preferred[0]])
        : [...preferredCandidates, ...fallbackCandidates];

    if (player.isPromotionAttempt) {
        legalNumbers = legalNumbers.filter(
            n => Math.abs(n - player.JerseyNum) > 2
        );
    }    

    const candidates = [];

    const onesDigit = player.JerseyNum % 10;
    const tensDigit = Math.floor(player.JerseyNum / 10);
    const favoredNumbers = [onesDigit, tensDigit, onesDigit + 10, tensDigit + 10];

    for (const number of favoredNumbers) {
        if (legalNumbers.includes(number) && !candidates.includes(number)) {
            candidates.push(number);
        }
    }

    for (const number of legalNumbers) {
        if (!candidates.includes(number)) candidates.push(number);
    }

    // ==========================================
    // Return both the ordered candidate list and
    // the index where fallback candidates begin.
    //
    // If no fallback numbers exist, the fallback
    // index will equal the candidate count.
    // ==========================================

    const fallbackStartIndex = player.isPromotionAttempt || !rule.fallback
        ? candidates.length
        : preferredCandidates.length;

    return {
        candidates,
        fallbackStartIndex
    };

}

module.exports = {
    generateCandidates
};