// Number rules helpers: determine legality, promotion eligibility,
// whether a player needs renumbering, and a summary reason object.
import RULES from "./rules.js";
import { isBlockedNumberForPlayer } from "./protectedNumbers.js";

export function isLegalNumber(player) {
    if (isBlockedNumberForPlayer(player, player.JerseyNum)) return false;
    if (player.teamRuleLocked && player.JerseyNum === player.teamRuleNumber) return true;
    const rule = RULES[player.Position];
    if (!rule) return true;
    const legalNumbers = [...(rule.preferred ?? []).flat(), ...(rule.fallback ?? []).flat()];
    return legalNumbers.includes(player.JerseyNum);
}

export function isPromotionEligible(player) {
    const rule = RULES[player.Position];
    if (!rule || !rule.promoteChance) return false;
    const secondaryGroup = rule.preferred[1];
    if (!secondaryGroup) return false;
    return secondaryGroup.includes(player.JerseyNum);
}

export function needsRenumber(player) {
    player.isPromotionAttempt = false;
    const blockedNumber = isBlockedNumberForPlayer(player, player.JerseyNum);
    const rule = RULES[player.Position];
    if (!rule) return blockedNumber;
    if (!isLegalNumber(player)) return true;
    if (!rule.promoteChance) return false;
    const secondaryGroup = rule.preferred[1];
    if (!secondaryGroup || !secondaryGroup.includes(player.JerseyNum)) return false;
    player.isPromotionAttempt = Math.random() < rule.promoteChance;
    return player.isPromotionAttempt;
}

export function getRenumberReason(player) {
    const protectedNumber = isBlockedNumberForPlayer(player, player.JerseyNum);
    return { suboptimal: !isLegalNumber(player), promotion: player.isPromotionAttempt === true, duplicate: player.mustRenumberDuplicate, protectedNumber };
}
