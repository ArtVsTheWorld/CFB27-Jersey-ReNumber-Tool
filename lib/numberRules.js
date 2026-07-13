// Number rules helpers: determine legality, promotion eligibility,
// whether a player needs renumbering, and a summary reason object.
const RULES = require("./rules");

function isLegalNumber(player) {
    const rule = RULES[player.Position];
    if (!rule) return true;
    const legalNumbers = [...(rule.preferred ?? []).flat(), ...(rule.fallback ?? []).flat()];
    return legalNumbers.includes(player.JerseyNum);
}

function isPromotionEligible(player) {
    const rule = RULES[player.Position];
    if (!rule || !rule.promoteChance) return false;
    const secondaryGroup = rule.preferred[1];
    if (!secondaryGroup) return false;
    return secondaryGroup.includes(player.JerseyNum);
}

function needsRenumber(player) {
    player.isPromotionAttempt = false; // reset
    const rule = RULES[player.Position];
    if (!rule) return false;
    if (!isLegalNumber(player)) return true;
    if (!rule.promoteChance) return false;
    const secondaryGroup = rule.preferred[1];
    if (!secondaryGroup || !secondaryGroup.includes(player.JerseyNum)) return false;
    player.isPromotionAttempt = Math.random() < rule.promoteChance;
    return player.isPromotionAttempt;
}

function getRenumberReason(player) { return { suboptimal: !isLegalNumber(player), promotion: player.isPromotionAttempt === true, duplicate: player.mustRenumberDuplicate }; }

module.exports = { isLegalNumber, isPromotionEligible, needsRenumber, getRenumberReason };