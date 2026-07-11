const RULES = require("./rules");

function isLegalNumber(player) {
    const rule = RULES[player.Position];
    if (!rule) return true;
    return rule.preferred.some(([min, max]) => player.JerseyNum >= min && player.JerseyNum <= max);
}

// ==========================================
// Returns true if the player should be
// renumbered.
//
// A player needs renumbering if:
//
// • His current jersey is suboptimal.
//
// • OR he's wearing a legal jersey in a
//   secondary range and randomly selected
//   for promotion into a preferred range.
//
// Examples:
//
// WR #84
//     Always renumber.
//
// MLB #47
//     Legal, but 25% chance to attempt a
//     move into 0-19.
//
// CB #23
//     Legal, but 50% chance to attempt a
//     move into 0-19.
// ==========================================

function needsRenumber(player) {
    const rule = RULES[player.Position];
    if (!rule) return false;

    if (!isLegalNumber(player)) {
        return true;
    }

    if (!rule.promoteChance) {
        return false;
    }

    const secondaryRange = rule.preferred[1];
    if (!secondaryRange) return false;

    const [min, max] = secondaryRange;
    if (player.JerseyNum < min || player.JerseyNum > max) {
        return false;
    }

    player.isPromotionAttempt = Math.random() < rule.promoteChance;
    return player.isPromotionAttempt;
}

// ==========================================
// Returns the reason a player needs a new
// jersey.
//
// A player may need renumbering because:
//
// • His current jersey is outside the
//   preferred range.
//
// • He won a promotion attempt.
//
// • He lost a duplicate jersey conflict.
//
// ==========================================

function getRenumberReason(player) {
    return {
        suboptimal: !isLegalNumber(player),
        promotion: player.isPromotionAttempt === true,
        duplicate: player.mustRenumberDuplicate
    };
}

module.exports = {

    isLegalNumber,
    needsRenumber,
    getRenumberReason

};