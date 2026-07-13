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

    if (rule.preferred.length < 2)
        return false;

    return rule.preferred[1].includes(player.JerseyNum);

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

    const preferredCandidates = (rule.preferred ?? []).flat();
    const fallbackCandidates = (rule.fallback ?? []).flat();

    let legalNumbers = player.isPromotionAttempt
        ? [...rule.preferred[0]]
        : [...preferredCandidates, ...fallbackCandidates];

    if (player.isPromotionAttempt) {
        legalNumbers = legalNumbers.filter(
            n => Math.abs(n - player.JerseyNum) > 2
        );
    }    

    const candidates = [];

    let favoredNumbers;

    if (player.Position === "DT") {

        const onesDigit = player.JerseyNum % 10;
        const tensDigit = Math.floor(player.JerseyNum / 10);

        favoredNumbers = [
            90 + onesDigit,
            90 + tensDigit
        ];

    } else {

        const onesDigit = player.JerseyNum % 10;
        const tensDigit = Math.floor(player.JerseyNum / 10);

        favoredNumbers = [
            onesDigit,
            tensDigit,
            onesDigit + 10,
            tensDigit + 10
        ];

    }

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