// =====================================
// Jersey ReNumber - Main Script
// Purpose: Read a CFB27 dynasty save, evaluate player jerseys,
// and reassign numbers to follow team/position rules while
// avoiding duplicates. This file orchestrates the process and
// uses helper modules in the `lib/` folder.
// =====================================

// Table Unique IDs
const PLAYER_TABLE_UID = 1612938518;
const TEAM_TABLE_UID = 3359508968;

// -----------------------------
// Module imports (ESM)
// -----------------------------
import fs from "fs";
import { input, confirm, select } from "@inquirer/prompts";
import { openSave, readTable } from "./lib/openSave.js";
import { shouldProcess } from "./lib/playerFilter.js";
import { isLegalNumber, isPromotionEligible, needsRenumber, getRenumberReason } from "./lib/numberRules.js";
import { generateCandidates } from "./lib/candidateGenerator.js";
import { resolveDuplicates, isNumberAvailable, isAllowedExistingDuplicate } from "./lib/duplicateResolver.js";
import RULES from "./lib/rules.js";
import { validateRoster } from "./lib/validator.js";
import { sortRoster } from "./lib/playerSorter.js";
import { applyTeamSpecificRules } from "./lib/teamRules.js";
import { colors, logChange, logDisplacement, logDuplicate, logError, logInfo } from "./lib/logger.js";

// Script configuration
const VERSION = "2.0";
const DEBUG = false;

// Jersey range constants
const MIN_JERSEY = 0;
const MAX_JERSEY = 99;

// Position grouping used for roster splitting
const OFFENSE = new Set([
    "QB",
    "HB",
    "FB",
    "WR",
    "TE"
]);

const DEFENSE = new Set([
    "LE",
    "RE",
    "DT",
    "LOLB",
    "MLB",
    "ROLB",
    "CB",
    "FS",
    "SS"
]);

// Small async helper used to add pauses for UX when printing.
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Prompt the user for the path to the dynasty save file.
 * Performs basic validation (exists and is a file) before returning.
 */
async function promptForSave() {

    const filePath = await input({
        message: "Paste the full path to your Dynasty save, or drag and drop it here and press Enter:",

        validate: (value) => {

            const cleanPath = value.trim().replace(/^['"]|['"]$/g, "");

            if (!cleanPath.length)
                return "Please enter a path.";

            if (!fs.existsSync(cleanPath))
                return "That dynasty save doesn't exist.";

            const stats = fs.statSync(cleanPath);

            if (!stats.isFile())
                return "Please select the dynasty SAVE file, not the folder.";

            return true;
        }
    });

    return filePath.replace(/^['"]|['"]$/g, "");
}

/**
 * Create a timestamped backup of the provided save file.
 * Returns the backup path so the caller can report location.
 */
function createBackup(savePath) {
    const now = new Date();
    const timestamp =
        `${String(now.getMonth() + 1).padStart(2, "0")}` +
        `${String(now.getDate()).padStart(2, "0")}` +
        `${String(now.getHours()).padStart(2, "0")}` +
        `${String(now.getMinutes()).padStart(2, "0")}`;

    const backupPath = `${savePath}b${timestamp}`;
    fs.copyFileSync(savePath, backupPath);
    return backupPath;
}

// Return a Map teamIndex -> DisplayName for quick lookups.
function getTeamNames(teamTable) {
    const map = new Map();
    for (const team of teamTable.records) map.set(team.TeamIndex, team.DisplayName);
    return map;
}

// Return a Set of team indexes controlled by the user.
function getUserControlledTeams(teamTable) {
    const set = new Set();
    for (const team of teamTable.records) if (team.UserCharacter.includes("1")) set.add(team.TeamIndex);
    return set;
}

// Return team indexes sorted by display name for predictable ordering.
function getSortedTeamIndexes(teamTable) {
    return [...teamTable.records].sort((a, b) => a.DisplayName.localeCompare(b.DisplayName)).map(team => team.TeamIndex);
}

// Build a Map of teamIndex -> array of player objects (full roster)
// Filters players according to shouldProcess and whether the
// user requested renumbering of user-controlled teams.
function buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes) {
    const teamRosters = new Map();
    for (const teamIndex of sortedTeamIndexes) teamRosters.set(teamIndex, []);
    for (const player of players.records) {
        if (!shouldProcess(player)) continue;
        if (!renumberUserTeams && userControlledTeams.has(player.TeamIndex)) continue;
        const roster = teamRosters.get(player.TeamIndex);
        if (roster) roster.push(player);
    }
    return teamRosters;
}

// Split each team's roster into offense and defense groups for generic
// renumbering while preserving the full roster for team traditions.
function buildTeamGroups(teamRosters) {
    const teamGroups = new Map();
    for (const [teamIndex, roster] of teamRosters) {
        const offense = [];
        const defense = [];
        for (const player of roster) if (OFFENSE.has(player.Position)) offense.push(player); else if (DEFENSE.has(player.Position)) defense.push(player);
        teamGroups.set(teamIndex, { offense, defense, all: roster });
    }
    return teamGroups;
}

// Helper that sorts each roster and resolves duplicate jerseys in-place.
function sortAndResolveTeamGroups(teamGroups) {
    for (const team of teamGroups.values()) {
        sortRoster(team.offense);
        sortRoster(team.defense);
        resolveDuplicates(team.offense);
        resolveDuplicates(team.defense);
    }
}

// Create a fresh statistics object used throughout processing.
function createStats() {
    return {
        playersEvaluated: 0,
        duplicatesFound: 0,
        duplicateResolutions: 0,
        promotions: 0,
        promotionEligible: 0,
        suboptimalCorrections: 0,
        primaryPreferredAssignments: 0,
        secondaryPreferredAssignments: 0,
        fallbackAssignments: 0,
        totalChanges: 0,
        displacedPlayers: 0,
        stillSuboptimal: 0,
        teamRulesApplied: 0,
        teamRulesSkipped: 0,
        teamRuleDisplacements: 0
    };
}

// Attempt to assign one of the candidates jersey numbers to player.
// This function will mutate player.JerseyNum (and possibly other
// players' numbers) when a valid assignment is made and returns an
// object describing the result.
function isTeamRuleReservedForPlayer(player, number) {
    return player.teamRuleReservedNumbers?.has(number) && !(player.teamRuleLocked && player.teamRuleNumber === number);
}

function assignJersey(player, roster, candidates, teamName) {
    const oldNumber = player.JerseyNum;
    let selectedCandidateIndex = -1;

    if (DEBUG) {
        console.log("assignJersey called for", player.FirstName, player.LastName, "with old number", oldNumber, "and candidates", candidates);
    }

    for (let i = 0; i < candidates.length; i++) {
        const number = candidates[i];

        if (isTeamRuleReservedForPlayer(player, number)) continue;

        if (!isLegalNumber({ ...player, JerseyNum: number })) {
            console.log("ILLEGAL ASSIGNMENT", player.Position, player.JerseyNum, "->", number);
        }

        if (number === oldNumber) continue;

        const available = isNumberAvailable(player, number, roster);

        if (available) {
            player.JerseyNum = number;
            player.wasRenumberedThisRun = true;
            resolveDuplicates(roster);
            return { wasRenumbered: true, selectedCandidateIndex: i, oldNumber };
        }

        const allowDisplacement = player.mustRenumberDuplicate;

        if (allowDisplacement) {
            const blocker = roster.find(
                p => !p.IsNIL && !p.teamRuleLocked && p !== player && !p.wasRenumberedThisRun && p.FirstName && p.LastName && p.Position && p.JerseyNum === number
            );

            if (blocker) {
                const blockerCandidates = generateCandidates(blocker).candidates;

                for (const blockerNumber of blockerCandidates) {
                    if (blockerNumber === blocker.JerseyNum || blockerNumber === oldNumber) continue;
                    if (isTeamRuleReservedForPlayer(blocker, blockerNumber)) continue;

                    const blockerCanMove = isNumberAvailable(blocker, blockerNumber, roster);
                    if (!blockerCanMove) continue;

                    const blockerOldNumber = blocker.JerseyNum;
                    blocker.JerseyNum = blockerNumber;
                    blocker.wasRenumberedThisRun = true;

                    player.JerseyNum = number;
                    player.wasRenumberedThisRun = true;

                    resolveDuplicates(roster);

                    return {
                        wasRenumbered: true,
                        selectedCandidateIndex: i,
                        oldNumber,
                        displacedPlayer: {
                            player: blocker,
                            oldNumber: blockerOldNumber,
                            newNumber: blocker.JerseyNum
                        }
                    };
                }
            }
        }
    }

    if (player.mustRenumberDuplicate) {
        for (let n = MIN_JERSEY; n <= MAX_JERSEY; n++) {
            if (isTeamRuleReservedForPlayer(player, n)) continue;
            if (isNumberAvailable(player, n, roster)) {
                player.JerseyNum = n;
                player.wasRenumberedThisRun = true;
                resolveDuplicates(roster);
                return { wasRenumbered: true, selectedCandidateIndex: 99, oldNumber };
            }
        }
    }

    if (DEBUG) {
        console.log("\n==================== PLAYER KEPT CURRENT NUMBER. ====================");
        console.log(`${teamName}: ${player.FirstName} ${player.LastName} (${player.Position})`);
        console.log(`Current Jersey : #${oldNumber}`);
        console.log(`Preferred Jerseys : ${candidates.join(", ")}`);
        console.log("Promotion:", player.isPromotionAttempt, "Duplicate:", player.mustRenumberDuplicate);
        console.log("===========================================================\n");
    }

    return { wasRenumbered: false, selectedCandidateIndex, oldNumber };
}

// Main processing: iterate teams and sides, apply passes to resolve
// duplicates, promote players, and optimize suboptimal numbers.
async function processTeamGroups(teamGroups, teamNames, enableTeamRules) {
    const stats = createStats();
    let initialSuboptimal = 0;

    for (const team of teamGroups.values()) {
        for (const player of team.all ?? [...team.offense, ...team.defense]) {
            if (!isLegalNumber(player)) initialSuboptimal++;
        }
    }

    // Team traditions are optional and run before generic roster processing.
    if (enableTeamRules) {
        applyTeamSpecificRules(teamGroups, teamNames, stats);
        sortAndResolveTeamGroups(teamGroups);
    }

    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;

        for (const side of ["offense", "defense"]) {

            sortRoster(team[side]);
            resolveDuplicates(team[side]);

            // ======================================================
            // PASS 1 - Resolve Conflicting Jersey Numbers
            // ======================================================

            for (const player of team[side]) {

                if (player.IsNIL)
                    continue;

                if (player.teamRuleLocked)
                    continue;

                if (player.wasRenumberedThisRun)
                    continue;

                resolveDuplicates(team[side]);

                needsRenumber(player);
                const reason = getRenumberReason(player);

                if (!reason.duplicate)
                    continue;

                const duplicateWith = team[side].find(otherPlayer =>
                    otherPlayer !== player &&
                    otherPlayer.JerseyNum === player.JerseyNum &&
                    !isAllowedExistingDuplicate(otherPlayer, player)
                );
                if (duplicateWith) {
                    stats.duplicatesFound++;
                    logDuplicate(teamName, player, duplicateWith);
                }

                // FIX: Force full candidate pool for duplicates
                player.isPromotionAttempt = false;
                
                
                const { candidates } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber, displacedPlayer } = 
                    assignJersey(player, team[side], candidates, teamName);

                if (wasRenumbered) {
                    resolveDuplicates(team[side]);
                }

                stats.playersEvaluated++;

                if (wasRenumbered) {
                    
                    stats.totalChanges++;
                    stats.duplicateResolutions++;

                    const rule = RULES[player.Position];

                    const primaryNumbers = new Set(rule.preferred[0]);

                    const secondaryNumbers = new Set(
                        (rule.preferred.slice(1)).flat()
                    );

                    if (primaryNumbers.has(player.JerseyNum)) {

                        stats.primaryPreferredAssignments++;

                    } else if (secondaryNumbers.has(player.JerseyNum)) {

                        stats.secondaryPreferredAssignments++;

                    } else {

                        stats.fallbackAssignments++;

                        if (DEBUG) {
                            console.log(
                                `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) : #${oldNumber} -> #${player.JerseyNum} [FALLBACK]`
                            );
                        }

                    }

                }

                if (wasRenumbered) {


                    if (displacedPlayer) {
                        stats.displacedPlayers++;
                        logDisplacement(teamName, displacedPlayer.player, displacedPlayer.oldNumber, displacedPlayer.newNumber, "resolving duplicate");
                    }

                    logChange(teamName, player, oldNumber, "duplicate resolved");
                }
            }

            sortRoster(team[side]);
            resolveDuplicates(team[side]);

            // ======================================================
            // PASS 2 - Optimize Remaining Non-Preferred Jerseys
            // ======================================================

            for (const player of team[side]) {

                if (player.IsNIL)
                    continue;

                if (player.teamRuleLocked)
                    continue;

                if (player.wasRenumberedThisRun)
                    continue;

                resolveDuplicates(team[side]);
                needsRenumber(player);
                const reason = getRenumberReason(player);

                const rule = RULES[player.Position];

                // const inPreferred =
                //     [...(rule.preferred ?? []).flat()].includes(player.JerseyNum);

                // if (
                //     inPreferred &&
                //     !reason.duplicate &&
                //     !reason.promotion
                // ) {
                //     continue;
                // }

                if (isPromotionEligible(player)) {
                    stats.promotionEligible++;
                }

                if (reason.suboptimal || reason.promotion || reason.duplicate) {

                    if (DEBUG) {
                        console.log(
                            `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) | #${player.JerseyNum} |`,
                            reason
                        );
                    }

                }

                if (reason.duplicate)
                    continue;

                if (!reason.suboptimal && !reason.promotion)
                    continue;

                player.isPromotionAttempt = reason.promotion;

                const { candidates } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber, displacedPlayer } = 
                    assignJersey(player, team[side], candidates, teamName);

                stats.playersEvaluated++;


                if (wasRenumbered) {

                    stats.totalChanges++;

                    const stillSuboptimal = !isLegalNumber(player);

                    if (reason.suboptimal && !stillSuboptimal) {
                        stats.suboptimalCorrections++;
                    }

                    if (reason.promotion) {
                        stats.promotions++;
                    }

                    const rule = RULES[player.Position];

                    const primaryNumbers = new Set(rule.preferred[0]);

                    const secondaryNumbers = new Set(
                        (rule.preferred.slice(1)).flat()
                    );

                    if (primaryNumbers.has(player.JerseyNum)) {

                        stats.primaryPreferredAssignments++;

                    } else if (secondaryNumbers.has(player.JerseyNum)) {

                        stats.secondaryPreferredAssignments++;

                    } else {

                        stats.fallbackAssignments++;

                        if (DEBUG) {
                            console.log(
                                `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) : #${oldNumber} -> #${player.JerseyNum} [FALLBACK]`
                            );
                        }

                    }

                    if (displacedPlayer) {
                        stats.displacedPlayers++;
                        logDisplacement(teamName, displacedPlayer.player, displacedPlayer.oldNumber, displacedPlayer.newNumber, "jersey optimization");
                    }

                    logChange(teamName, player, oldNumber, reason.promotion ? "promotion" : "position range corrected");
                    
                    
                }


            }

            sortRoster(team[side]);
            resolveDuplicates(team[side]);

        }
    }

    console.log("\nChecking for remaining duplicate jerseys...");

    for (const [teamIndex, team] of teamGroups) {

        const teamName = teamNames.get(teamIndex);

        for (const side of ["offense", "defense"]) {

            const seen = new Map();

            for (const player of team[side]) {

                const other = seen.get(player.JerseyNum);

                if (other) {
                    
                    if (DEBUG) {
                        console.log(
                            `FINAL DUPLICATE: ${teamName} ${side} #${player.JerseyNum}
                            ${other.FirstName} ${other.LastName}
                            ${player.FirstName} ${player.LastName}`
                        );
                    }
                }

                seen.set(player.JerseyNum, player);
            }
        }
    }

    // =====================================
    // FINAL STATISTICS PASS
    // =====================================

    stats.stillSuboptimal = 0;
    stats.totalChanges = 0;

    for (const [, team] of teamGroups) {

        for (const player of team.all ?? [...team.offense, ...team.defense]) {

            if (player.originalJerseyNum !== player.JerseyNum) {
                stats.totalChanges++;
            }

            if (!isLegalNumber(player)) {
                stats.stillSuboptimal++;
                if (DEBUG) {
                    console.log(
                        "STILL SUBOPTIMAL:",
                        player.FirstName,
                        player.LastName,
                        player.Position,
                        "#"+player.JerseyNum
                    );
                }

            }

        }

    }

    return { stats, initialSuboptimal };
}

function printSummary(initialSuboptimal, stats) {
    const totalDisplacements = stats.displacedPlayers + stats.teamRuleDisplacements;
    const row = (label, value) => console.log(`${label.padEnd(31)} ${colors.bold(value)}`);

    console.log(colors.bold("\n================================================"));
    console.log(colors.bold("RUN SUMMARY"));
    console.log(colors.bold("================================================"));
    row("Players whose number changed", stats.totalChanges);
    row("Duplicate conflicts found", stats.duplicatesFound);
    row("Duplicate conflicts resolved", stats.duplicateResolutions);
    row("Players promoted", stats.promotions);
    row("Invalid position numbers fixed", stats.suboptimalCorrections);
    row("Players displaced", totalDisplacements);
    row("Fallback numbers assigned", stats.fallbackAssignments);

    console.log(colors.bold("\nTEAM TRADITIONS"));
    console.log("------------------------------------------------");
    row("Rules applied", stats.teamRulesApplied);
    row("Rules skipped", stats.teamRulesSkipped);

    console.log(colors.bold("\nROSTER HEALTH"));
    console.log("------------------------------------------------");
    row("Invalid numbers before run", initialSuboptimal);
    row("Invalid numbers after run", stats.stillSuboptimal);

    if (stats.promotionEligible > 0) {
        row("Players eligible for promotion", stats.promotionEligible);
        row("Successful promotion rate", `${(stats.promotions / stats.promotionEligible * 100).toFixed(1)}%`);
    }
}


// Run final validation passes against `validateRoster` helpers and
// return a summary of duplicates and players still in suboptimal numbers.
function validateTeamGroups(teamGroups, teamNames) {
    let duplicateCount = 0;
    let unchangedCount = 0;

    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;
        const offense = validateRoster(teamName, "Offense", team.offense);
        const defense = validateRoster(teamName, "Defense", team.defense);
        duplicateCount += offense.duplicates + defense.duplicates;
        unchangedCount += offense.suboptimal + defense.suboptimal;
    }

    return { duplicateCount, unchangedCount };
}

function printValidationResults(results) {
    console.log("\n====================================");
    console.log("Validation");
    console.log("====================================\n");

    if (results.duplicateCount === 0) {
        console.log("✓ No duplicate jerseys detected.");
    } else {
        console.log(`✗ ${results.duplicateCount} duplicate jersey(s) detected.`);
    }

    if (results.unchangedCount === 0) {
        console.log("✓ Every player is wearing a preferred jersey.");
    } else {
        console.log(`✓ ${results.unchangedCount} player(s) are still in suboptimal numbers. Better luck next year!\n`);
    }
}


// Orchestration: drive the full user interaction, loading, processing,
// validation and saving of the dynasty save.
async function runTool() {

    console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║            CFB 27 JERSEY RENUMBER TOOL                     ║
║                                                            ║
║                     Version ${VERSION}                            ║
║                        by Ace                              ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝

`);

    await sleep(1000);
    const savePath = await promptForSave();
    await sleep(800);

    // Preview and apply share the same processing path; only file writes differ.
    const runMode = await select({
        message: "Choose a run mode:",
        choices: [
            { name: "Preview only (dry run - no backup and no save)", value: "preview" },
            { name: "Apply changes (backup and save)", value: "apply" }
        ]
    });
    const isPreview = runMode === "preview";

    console.log(`\nSelected dynasty:\n${savePath}\n`);
    logInfo(`Run mode: ${isPreview ? "PREVIEW ONLY" : "APPLY CHANGES"}`);
    await sleep(800);

    // Backups are created only when the user intends to save changes.
    if (!isPreview) {
    console.log("The tool will:");
    await sleep(10);
    console.log(" • Create a backup");
    await sleep(10);
    console.log(" • ReNumber player jerseys");
    await sleep(100);
    console.log(" • Save the modified dynasty\n");

    } else {
        console.log("The tool will:");
        console.log(" - Simulate all jersey changes in memory");
        console.log(" - Show the full change log and summary");
        console.log(" - Leave the dynasty file untouched\n");
    }

    const shouldContinue = await confirm({
        message: "Would you like to continue?"
    });
    if (!shouldContinue) {
        console.log("\nOperation cancelled.");
        console.log("No changes were made.");
        return;
    }
    await sleep(750);

    const renumberUserTeams = await confirm({
        message: "Would you like to ReNumber user-controlled teams as well?"
    });
    await sleep(750);

    // Let users opt out of traditions while keeping all generic number rules.
    const enableTeamRules = await confirm({
        message: "Would you like to enable team-specific jersey rules?",
        default: true
    });
    logInfo(`Team-specific jersey rules: ${enableTeamRules ? "ENABLED" : "DISABLED"}`);
    await sleep(750);

    if (!isPreview) {
    const backupPath = createBackup(savePath);
    console.log("\n✓ Backup created");
    console.log(`Location: ${backupPath}\n`);
    await sleep(100);
    console.log("Backups are saved to the same directory as the original save.\n");
    await sleep(3500);
    } else {
        logInfo("\nPREVIEW: No backup will be created and the dynasty will not be saved.\n");
    }

    const franchise = await openSave(savePath);
    console.log("Save opened successfully.");
    await sleep(1000);

    console.log("Reading Player table...");
    const players = await readTable(franchise, PLAYER_TABLE_UID);
    await sleep(800);
    console.log(`Loaded ${players.records.length} players.`);
    await sleep(800);

    console.log("Reading Team table...");
    const teams = await readTable(franchise, TEAM_TABLE_UID);
    await sleep(800);
    console.log(`Loaded ${teams.records.length} teams.`);
    await sleep(800);

    const teamNames = getTeamNames(teams);
    const userControlledTeams = getUserControlledTeams(teams);
    const sortedTeamIndexes = getSortedTeamIndexes(teams);

    console.log("\nUser-controlled teams:");
    for (const teamIndex of userControlledTeams) {
        console.log(`${teamIndex} - ${teamNames.get(teamIndex)}`);
    }
    console.log(`Found ${userControlledTeams.size} user-controlled team(s).\n`);
    await sleep(800);

    console.log("\nBuilding Rosters...\n");
    await sleep(800);

    // Initialize transient state used for locking and before/after statistics.
    for (const player of players.records) {
        player.wasRenumberedThisRun = false;
        player.teamRuleLocked = false;
        player.teamRuleNumber = undefined;
        player.teamRuleReservedNumbers = new Set();
        player.originalJerseyNum = player.JerseyNum;
    }

    const teamRosters = buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes);
    const teamGroups = buildTeamGroups(teamRosters);
    sortAndResolveTeamGroups(teamGroups);

    console.log("Rosters Built!\n");
    await sleep(800);

    console.log("\nReNumbering Players Now...\n");
    await sleep(1000);
    const { stats, initialSuboptimal } = await processTeamGroups(teamGroups, teamNames, enableTeamRules);

    //
    // Recalculate duplicate flags now that every
    // jersey change has been completed.
    //
    sortAndResolveTeamGroups(teamGroups);

    await sleep(1200);
    printSummary(initialSuboptimal, stats);


    await sleep(800);
    const validationResults = validateTeamGroups(teamGroups, teamNames);
    printValidationResults(validationResults);

    // ╔════════════════════════════════════════════════════════════╗
    // ║                                                            ║
    // ║                                                            ║
    // ║                        SAVING SECTION                      ║
    // ║                                                            ║
    // ║                                                            ║
    // ╚════════════════════════════════════════════════════════════╝

    await sleep(800);
    // Preview exits after reporting; apply mode commits the in-memory changes.
    if (isPreview) {
        console.log(colors.cyan("\nPREVIEW COMPLETE: No backup was created and no changes were saved."));
    } else {
        console.log("\nSaving dynasty...");
        await franchise.save();
        console.log(colors.green("Dynasty saved successfully!"));
    }
    await sleep(800);
}

// ======================================================
// Main Entry Point
// ======================================================


// Standard Node entry point wrapper. Keeps run-time errors contained
// and provides a friendly exit message.
async function main() {

    console.clear();

    try {

        await runTool();

        console.log(`
=====================================
Thanks for using Jersey ReNumber!
=====================================
`);

        await sleep(2000);

    } catch (err) {

        console.error("\nERROR:\n");
        console.error(err);
        process.exit(1);

    }

}



// Run the program
main();
