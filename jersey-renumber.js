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
import { input, confirm } from "@inquirer/prompts";
import { openSave, readTable } from "./lib/openSave.js";
import { shouldProcess } from "./lib/playerFilter.js";
import { isLegalNumber, isPromotionEligible, needsRenumber, getRenumberReason } from "./lib/numberRules.js";
import { generateCandidates } from "./lib/candidateGenerator.js";
import { resolveDuplicates, isNumberAvailable } from "./lib/duplicateResolver.js";
import RULES from "./lib/rules.js";
import { validateRoster } from "./lib/validator.js";
import { sortRoster } from "./lib/playerSorter.js";

// Script configuration
const VERSION = "1.5";
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
    "TE",
    "LT",
    "LG",
    "C",
    "RG",
    "RT"
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
        `${String(now.getFullYear()).slice(-2)}` +
        `${String(now.getMonth() + 1).padStart(2, "0")}` +
        `${String(now.getDate()).padStart(2, "0")}` +
        `${String(now.getHours()).padStart(2, "0")}` +
        `${String(now.getMinutes()).padStart(2, "0")}` +
        `${String(now.getSeconds()).padStart(2, "0")}`;

    const backupPath = `${savePath}backup${timestamp}`;
    fs.copyFileSync(savePath, backupPath);
    return backupPath;
}

// Return a Map teamIndex -> DisplayName for quick lookups.
function getTeamNames(teamTable) {
    const map = new Map(); for (const team of teamTable.records) map.set(team.TeamIndex, team.DisplayName); return map;
}

// Return a Set of team indexes controlled by the user.
function getUserControlledTeams(teamTable) {
    const set = new Set(); for (const team of teamTable.records) if (team.UserCharacter.includes("1")) set.add(team.TeamIndex); return set;
}

// Return team indexes sorted by display name for predictable ordering.
function getSortedTeamIndexes(teamTable) {
    return [...teamTable.records].sort((a, b) => a.DisplayName.localeCompare(b.DisplayName)).map(team => team.TeamIndex);
}

// Build a Map of teamIndex -> array of player objects (full roster)
// Filters players according to `shouldProcess` and whether the
// user requested renumbering of user-controlled teams.
function buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes) {
    const teamRosters = new Map(); for (const teamIndex of sortedTeamIndexes) teamRosters.set(teamIndex, []);
    for (const player of players.records) {
        if (!shouldProcess(player)) continue; if (!renumberUserTeams && userControlledTeams.has(player.TeamIndex)) continue; const roster = teamRosters.get(player.TeamIndex); if (roster) roster.push(player);
    }
    return teamRosters;
}

// Split each team's roster into `offense` and `defense` groups
// for separate processing and sorting.
function buildTeamGroups(teamRosters) {
    const teamGroups = new Map(); for (const [teamIndex, roster] of teamRosters) {
        const offense = [], defense = [];
        for (const player of roster) if (OFFENSE.has(player.Position)) offense.push(player); else if (DEFENSE.has(player.Position)) defense.push(player);
        teamGroups.set(teamIndex, { offense, defense });
    }
    return teamGroups;
}

// Helper that sorts each roster and resolves duplicate jerseys in-place.
function sortAndResolveTeamGroups(teamGroups) {
    for (const team of teamGroups.values()) { sortRoster(team.offense); sortRoster(team.defense); resolveDuplicates(team.offense); resolveDuplicates(team.defense); }
}

// Create a fresh statistics object used throughout processing.
function createStats() {
    return {
        playersEvaluated: 0,

        duplicateResolutions: 0,
        promotions: 0,
        promtionEligible: 0,
        suboptimalCorrections: 0,

        primaryPreferredAssignments: 0,
        secondaryPreferredAssignments: 0,
        fallbackAssignments: 0,
        totalChanges: 0,

        stillSuboptimal: 0
    };
}

// Attempt to assign one of the `candidates` jersey numbers to `player`.
// This function will mutate `player.JerseyNum` (and possibly other
// players' numbers) when a valid assignment is made and returns an
// object describing the result.
function assignJersey(player, roster, candidates, teamName) {
    const oldNumber = player.JerseyNum;
    let selectedCandidateIndex = -1;
    
    if (DEBUG) {
        console.log('assignJersey called for', player.FirstName, player.LastName, 'with old number', oldNumber, 'and candidates', candidates);
    }


    for (let i = 0; i < candidates.length; i++) {
        const number = candidates[i];

        if (!isLegalNumber({ ...player, JerseyNum: number })) {
            console.log(
                "ILLEGAL ASSIGNMENT",
                player.Position,
                player.JerseyNum,
                "->",
                number
            );
        }

        if (number === oldNumber)
            continue;

        // 1. Check if the number is naturally vacant
        const available = isNumberAvailable(player, number, roster);

        if (available) {
            // MUTATE IMMEDIATELY: Claim the number right now so the very next 
            // player evaluated in your script will see it as taken.
            player.JerseyNum = number;
            player.wasRenumberedThisRun = true;
            resolveDuplicates(roster);
            
            return {
                wasRenumbered: true,
                selectedCandidateIndex: i,
                oldNumber
            };
        }

        // -----------------------------------------
        // One-level displacement
        // -----------------------------------------
        const blocker = roster.find(
            p =>
                p !== player &&
                p.FirstName &&
                p.LastName &&
                p.Position &&
                p.JerseyNum === number
        );

        if (blocker) {

            if (blocker.wasRenumberedThisRun)
                continue;

            const blockerCandidates = generateCandidates(blocker).candidates;

            for (const blockerNumber of blockerCandidates) {
                // Don't keep the same number
                if (blockerNumber === blocker.JerseyNum)
                    continue;

                // Don't immediately steal the player's old number
                if (blockerNumber === oldNumber)
                    continue;

                const blockerCanMove =
                    isNumberAvailable(blocker, blockerNumber, roster);

                if (!blockerCanMove)
                    continue;

                // Move blocker first
                blocker.JerseyNum = blockerNumber;
                blocker.wasRenumberedThisRun = true;

                player.JerseyNum = number;
                player.wasRenumberedThisRun = true;

                resolveDuplicates(roster);

                return {
                    wasRenumbered: true,
                    selectedCandidateIndex: i,
                    oldNumber
                };
            }
        }

    }

    // ======================================================
    // EMERGENCY FAILSAFE
    //
    // If every preferred and fallback jersey is unavailable,
    // assign the first legal unused number regardless of
    // positional preference.
    //
    // This guarantees duplicate jerseys are never left behind.
    // ======================================================

    if (player.mustRenumberDuplicate) {
        for (let n = MIN_JERSEY; n <= MAX_JERSEY; n++) {
            if (isNumberAvailable(player, n, roster)) {
                player.JerseyNum = n;
                player.wasRenumberedThisRun = true;

                resolveDuplicates(roster);

                return {
                    wasRenumbered: true,
                    selectedCandidateIndex: 99, // Failsafe indicator
                    oldNumber
                };
            }
        }
    }


    if (DEBUG) {
        // If we reach this point, absolutely no number could be found/stolen.

        console.log("\n==================== PLAYER KEPT CURRENT NUMBER. ====================");

        console.log(
            `${teamName}: ${player.FirstName} ${player.LastName} (${player.Position})`
        );

        console.log(`Current Jersey : #${oldNumber}`);

        console.log(`Preferred Jerseys : ${candidates.join(", ")}`);

        console.log(
            "Promotion:",
            player.isPromotionAttempt,
            "Duplicate:",
            player.mustRenumberDuplicate
        );

        console.log("===========================================================\n");

    }

    return {
        wasRenumbered: false,
        selectedCandidateIndex,
        oldNumber
    };
}

// Main processing: iterate teams and sides, apply passes to resolve
// duplicates, promote players, and optimize suboptimal numbers.
async function processTeamGroups(teamGroups, teamNames) {
    const stats = createStats();
    let initialSuboptimal = 0;

    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;

        for (const side of ["offense", "defense"]) {

            //
            // Count initial suboptimal players
            //
            for (const player of team[side]) {
                needsRenumber(player);

                if (getRenumberReason(player).suboptimal) {
                    initialSuboptimal++;
                }
            }

            sortRoster(team[side]);
            resolveDuplicates(team[side]);

            // Reset per-run flags
            for (const player of team[side]) player.wasRenumberedThisRun = false;
            for (const player of team[side]) player.originalJerseyNum = player.JerseyNum;

            // ======================================================
            // PASS 1 - Promote Players Into Preferred Jersey Ranges
            // ======================================================

            for (const player of team[side]) {

                if (player.wasRenumberedThisRun)
                    continue;

                resolveDuplicates(team[side]);
                needsRenumber(player);
                const reason = getRenumberReason(player);

                if (!reason.duplicate)
                    continue;

                // FIX: Force full candidate pool for duplicates
                player.isPromotionAttempt = false;
                
                
                const { candidates } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber } =
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
                    console.log(
                        `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) : #${oldNumber} -> #${player.JerseyNum}`
                    );
                }
            }

            sortRoster(team[side]);
            resolveDuplicates(team[side]);

            // ======================================================
            // PASS 2 - Optimize Remaining Non-Preferred Jerseys
            // ======================================================

            for (const player of team[side]) {

                if (player.wasRenumberedThisRun)
                    continue;

                resolveDuplicates(team[side]);
                needsRenumber(player);
                const reason = getRenumberReason(player);

                if (isPromotionEligible(player)) {
                    stats.promtionEligible++;
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
                const { wasRenumbered, selectedCandidateIndex, oldNumber } =
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
                    
                    console.log(
                        `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) : #${oldNumber} -> #${player.JerseyNum}`
                    );
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

    for (const [, team] of teamGroups) {

        for (const side of ["offense", "defense"]) {

            for (const player of team[side]) {

                if (!isLegalNumber(player)) {
                    stats.stillSuboptimal++;
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
    console.log("\n====================================");
    console.log("Initial Analysis");
    console.log("====================================");

    console.log(`Players Outside Preferred Range : ${initialSuboptimal}`);
    console.log("  (Players whose jersey was not in a preferred range before processing.)");

    console.log("\n====================================");
    console.log("ReNumbering Summary");
    console.log("====================================");

    console.log("Promotion Statistics");
    console.log("------------------------------------");
    console.log(`Promotion Eligible              : ${stats.promtionEligible}`);
    console.log("  (Players who thought about moving to a better jersey.)");
    console.log(`Successful Promotions           : ${stats.promotions}`);
    console.log("  (Players who chose to move into a better jersey.)");

    if (stats.promtionEligible > 0) {
        console.log(
            `Promotion Success Rate          : ${(
                stats.promotions /
                stats.promtionEligible *
                100
            ).toFixed(1)}%`
        );
    }

    console.log("");

    console.log("------------------------------------");
    console.log(`Players Eligible                : ${stats.playersEvaluated}`);
    console.log("  (Players who either had a duplicate jersey, tried to upgrade, or were outside their preferred range.)");

    console.log("");

    console.log("Changes Made");
    console.log("------------------------------------");
    console.log(`Duplicate Resolutions           : ${stats.duplicateResolutions}`);
    console.log("  (Players renumbered because of a duplicate jersey.)");

    console.log(`Suboptimal Corrections          : ${stats.suboptimalCorrections}`);
    console.log("  (Players moved from a non-preferred number.)");

    console.log("");

    console.log("Assignment Types");
    console.log("------------------------------------");
    console.log(`Primary Preferred              : ${stats.primaryPreferredAssignments}`);
    console.log("  (Assigned into the position's primary preferred range.)");

    console.log(`Secondary Preferred            : ${stats.secondaryPreferredAssignments}`);
    console.log("  (Assigned into a secondary preferred range.)");

    console.log(`Fallback Assignments           : ${stats.fallbackAssignments}`);
    console.log("  (Assigned into the fallback range because no preferred number was available.)");

    console.log("                                --------");
    console.log(`Total Jersey Changes           : ${stats.totalChanges}`);

    if (
        stats.totalChanges !==
        stats.primaryPreferredAssignments +
        stats.secondaryPreferredAssignments +
        stats.fallbackAssignments
    ) {
        console.warn("\nWARNING: Assignment type counts do not balance.");
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

    console.log(`\nSelected dynasty:\n${savePath}\n`);
    await sleep(800);

    console.log("The tool will:");
    await sleep(10);
    console.log(" • Create a backup");
    await sleep(10);
    console.log(" • ReNumber player jerseys");
    await sleep(100);
    console.log(" • Save the modified dynasty\n");

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

    const backupPath = createBackup(savePath);
    console.log("\n✓ Backup created");
    console.log(`Location: ${backupPath}\n`);
    await sleep(100);
    console.log("Backups are saved to the same directory as the original save.\n");
    await sleep(3500);

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

    for (const player of players.records) player.wasRenumberedThisRun = false;

    const teamRosters = buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes);
    const teamGroups = buildTeamGroups(teamRosters);
    sortAndResolveTeamGroups(teamGroups);

    console.log("Rosters Built!\n");
    await sleep(800);

    console.log("\nReNumbering Players Now...\n");
    await sleep(1000);
    const { stats, initialSuboptimal } = await processTeamGroups(teamGroups, teamNames);

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

    console.log("\nSaving dynasty...");
    await franchise.save();
    console.log("Dynasty saved successfully!");
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
      