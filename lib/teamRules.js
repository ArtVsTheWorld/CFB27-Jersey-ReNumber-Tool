import { generateCandidates } from "./candidateGenerator.js";
import { isNumberAvailable } from "./duplicateResolver.js";
import { logChange, logDisplacement, logInfo, logWarning, playerDetails, playerName } from "./logger.js";
import { isBlockedNumberForPlayer } from "./protectedNumbers.js";

// Team-specific traditions are data-driven so additional schools can be added
// without changing the assignment algorithm.
export const TEAM_RULES = [
    {
        teamNames: ["LSU", "Louisiana State"],
        number: 7,
        label: "LSU #7 tradition"
    }
];

// Normalize display names before matching aliases from the team table.
function normalizeTeamName(name) {
    return String(name ?? "").trim().toLowerCase();
}

// Return the configured tradition for a team, when one exists.
function findRule(teamName) {
    const normalized = normalizeTeamName(teamName);
    return TEAM_RULES.find(rule => rule.teamNames.some(name => normalizeTeamName(name) === normalized));
}

// Rank recipients by overall rating. Ties favor the current holder to avoid
// unnecessary churn, then use the player name for deterministic results.
function compareRecipients(a, b, number) {
    const overallDifference = (b.OverallRating ?? 0) - (a.OverallRating ?? 0);
    if (overallDifference !== 0) return overallDifference;
    if (a.JerseyNum === number && b.JerseyNum !== number) return -1;
    if (b.JerseyNum === number && a.JerseyNum !== number) return 1;
    return playerName(a).localeCompare(playerName(b));
}

// Locate the offense or defense roster used for same-side availability checks.
function sideForPlayer(team, player) {
    if (team.offense.includes(player)) return team.offense;
    if (team.defense.includes(player)) return team.defense;
    return null;
}

// Find a legal open number for a player who must vacate a reserved number.
function findReplacement(player, roster, reservedNumber) {
    player.isPromotionAttempt = false;
    const { candidates } = generateCandidates(player);
    return candidates.find(number =>
        number !== reservedNumber &&
        !isBlockedNumberForPlayer(player, number) &&
        isNumberAvailable(player, number, roster)
    );
}

// Apply every configured tradition before normal duplicate and promotion
// passes. Changes are rolled back if every current holder cannot be relocated.
export function applyTeamSpecificRules(teamGroups, teamNames, stats) {
    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;
        const rule = findRule(teamName);
        if (!rule) continue;

        // Team traditions are evaluated across both sides of the ball.
        const roster = [...team.offense, ...team.defense];
        const eligiblePlayers = roster.filter(player => !player.IsNIL);
        if (eligiblePlayers.length === 0) {
            stats.teamRulesSkipped++;
            logWarning(`TEAM RULE SKIPPED: ${teamName} | ${rule.label} has no eligible non-NIL player.`);
            continue;
        }

        eligiblePlayers.sort((a, b) => compareRecipients(a, b, rule.number));
        const recipient = eligiblePlayers[0];
        const currentHolders = roster.filter(player => player !== recipient && player.JerseyNum === rule.number);
        const nilBlocker = currentHolders.find(player => player.IsNIL);

        if (nilBlocker) {
            stats.teamRulesSkipped++;
            logWarning(
                `TEAM RULE SKIPPED: ${teamName} | ${rule.label} is protected by NIL player ${playerDetails(nilBlocker)}.`
            );
            continue;
        }

        // Snapshot the roster so this rule is atomic if relocation fails.
        const snapshots = roster.map(player => ({ player, number: player.JerseyNum, wasRenumbered: player.wasRenumberedThisRun }));
        const recipientOldNumber = recipient.JerseyNum;
        recipient.JerseyNum = rule.number;

        // Temporarily award the number, then relocate every other holder.
        let failedHolder = null;
        const relocations = [];
        for (const holder of currentHolders) {
            const side = sideForPlayer(team, holder);
            const replacement = findReplacement(holder, side, rule.number);
            if (replacement === undefined) {
                failedHolder = holder;
                break;
            }
            const oldNumber = holder.JerseyNum;
            holder.JerseyNum = replacement;
            holder.wasRenumberedThisRun = true;
            relocations.push({ player: holder, oldNumber, newNumber: replacement });
        }

        if (failedHolder) {
            for (const snapshot of snapshots) {
                snapshot.player.JerseyNum = snapshot.number;
                snapshot.player.wasRenumberedThisRun = snapshot.wasRenumbered;
            }
            stats.teamRulesSkipped++;
            logWarning(
                `TEAM RULE SKIPPED: ${teamName} | Could not relocate ${playerDetails(failedHolder)} from #${rule.number}.`
            );
            continue;
        }

        // Lock the recipient so later generic passes cannot undo the tradition.
        recipient.teamRuleLocked = true;
        recipient.teamRuleNumber = rule.number;
        recipient.wasRenumberedThisRun = recipientOldNumber !== rule.number;
        stats.teamRulesApplied++;
        stats.teamRuleDisplacements += relocations.length;

        logInfo(`TEAM RULE: ${teamName} | ${rule.label} awarded to ${playerDetails(recipient)}.`);
        for (const relocation of relocations) {
            logDisplacement(teamName, relocation.player, relocation.oldNumber, relocation.newNumber, rule.label);
        }
        if (recipientOldNumber !== rule.number) {
            logChange(teamName, recipient, recipientOldNumber, rule.label);
        }
    }
}
