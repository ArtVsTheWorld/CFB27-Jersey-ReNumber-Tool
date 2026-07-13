const RULES = require("./rules");

function isLegalNumber(player) {

    const rule = RULES[player.Position];

    if (!rule)
        return true;

    const legalNumbers = [
        ...(rule.preferred ?? []).flat(),
        ...(rule.fallback ?? []).flat()
    ];

    return legalNumbers.includes(player.JerseyNum);

}

function isPromotionEligible(player) {

    const rule = RULES[player.Position];

    if (!rule)
        return false;

    if (!rule.promoteChance)
        return false;

    const secondaryGroup = rule.preferred[1];

    if (!secondaryGroup)
        return false;

    return secondaryGroup.includes(player.JerseyNum);

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

    // Always reset promotion status first.
    player.isPromotionAttempt = false;

    const rule = RULES[player.Position];
    if (!rule)
        return false;

    if (!isLegalNumber(player))
        return true;

    if (!rule.promoteChance)
        return false;

    const secondaryGroup = rule.preferred[1];

    if (!secondaryGroup)
        return false;

    if (!secondaryGroup.includes(player.JerseyNum))
        return false;

    player.isPromotionAttempt =
        Math.random() < rule.promoteChance;

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
    isPromotionEligible,
    needsRenumber,
    getRenumberReason

};