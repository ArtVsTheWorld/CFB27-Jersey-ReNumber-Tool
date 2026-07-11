// ==========================================
// CFB 27 Jersey ReNumber Tool
// Main entry point
// ==========================================

// Import helper functions
const fs = require("fs");
const { resolveSavePath } = require("./savePicker");
const { openSave, readTable } = require("./lib/openSave");
const { shouldProcess } = require("./lib/playerFilter");
const {
    needsRenumber,
    getRenumberReason
} = require("./lib/numberRules");
const { generateCandidates } = require("./lib/candidateGenerator");
const {
    resolveDuplicates,
    isNumberAvailable
} = require("./lib/duplicateResolver");
const { validateRoster } = require("./lib/validator");
const { sortRoster } = require("./lib/playerSorter");
const VERSION = "1.0";


const readline = require("readline");

const MIN_JERSEY = 0;
const MAX_JERSEY = 99;

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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function askYesNo(question) {

    while (true) {

        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        const answer = await new Promise(resolve => {
            rl.question(`${question} (Y/N): `, input => {
                rl.close();
                resolve(input.trim().toLowerCase());
            });
        });

        if (answer === "y" || answer === "yes")
            return true;

        if (answer === "n" || answer === "no")
            return false;

        console.log("\nInvalid input. Please enter Y or N.\n");

    }

}

function createBackup(savePath) {
    const now = new Date();
    const timestamp =
        `${String(now.getFullYear()).slice(-2)}` +
        `${String(now.getMonth() + 1).padStart(2, "0")}` +
        `${String(now.getDate()).padStart(2, "0")}-` +
        `${String(now.getHours()).padStart(2, "0")}` +
        `${String(now.getMinutes()).padStart(2, "0")}` +
        `${String(now.getSeconds()).padStart(2, "0")}`;

    const backupPath = `${savePath}_backup_${timestamp}`;
    fs.copyFileSync(savePath, backupPath);
    return backupPath;
}

function getTeamNames(teamTable) {
    const map = new Map();
    for (const team of teamTable.records) {
        map.set(team.TeamIndex, team.DisplayName);
    }
    return map;
}

function getUserControlledTeams(teamTable) {
    const set = new Set();
    for (const team of teamTable.records) {
        if (team.UserCharacter.includes("1")) {
            set.add(team.TeamIndex);
        }
    }
    return set;
}

function getSortedTeamIndexes(teamTable) {
    return [...teamTable.records]
        .sort((a, b) => a.DisplayName.localeCompare(b.DisplayName))
        .map(team => team.TeamIndex);
}

function buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes) {
    const teamRosters = new Map();
    for (const teamIndex of sortedTeamIndexes) {
        teamRosters.set(teamIndex, []);
    }

    for (const player of players.records) {
        if (!shouldProcess(player)) continue;
        if (!renumberUserTeams && userControlledTeams.has(player.TeamIndex)) continue;

        const roster = teamRosters.get(player.TeamIndex);
        if (roster) {
            roster.push(player);
        }
    }

    return teamRosters;
}

function buildTeamGroups(teamRosters) {
    const teamGroups = new Map();

    for (const [teamIndex, roster] of teamRosters) {
        const offense = [];
        const defense = [];

        for (const player of roster) {
            if (OFFENSE.has(player.Position)) {
                offense.push(player);
            } else if (DEFENSE.has(player.Position)) {
                defense.push(player);
            }
        }

        teamGroups.set(teamIndex, { offense, defense });
    }

    return teamGroups;
}

function sortAndResolveTeamGroups(teamGroups) {
    for (const team of teamGroups.values()) {
        sortRoster(team.offense);
        sortRoster(team.defense);
        resolveDuplicates(team.offense);
        resolveDuplicates(team.defense);
    }
}

function createStats() {
    return {
        checked: 0,

        duplicateResolutions: 0,
        promotions: 0,
        suboptimalCorrections: 0,

        preferredRenumbers: 0,
        fallbackRenumbers: 0,

        unchanged: 0
    };
}

function assignJersey(player, roster, candidates, teamName) {
    const oldNumber = player.JerseyNum;
    let selectedCandidateIndex = -1;
    let wasRenumbered = false;

    for (let i = 0; i < candidates.length; i++) {
        const number = candidates[i];

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

    // If we reach this point, absolutely no number could be found/stolen
    if (!wasRenumbered) {

        console.log("\n==================== COULD NOT ASSIGN JERSEY ====================");

        console.log(
            `${teamName}: ${player.FirstName} ${player.LastName} (${player.Position})`
        );

        console.log(`Current Jersey : #${oldNumber}`);

        console.log(`Preferred Jerseys : ${candidates.join(", ")}`);

        console.log("===========================================================\n");

    }

    return {
        wasRenumbered: false,
        selectedCandidateIndex,
        oldNumber
    };
}

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
            for (const player of team[side]) {
                player.wasRenumberedThisRun = false;
            }

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

                const { candidates, fallbackStartIndex } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber } =
                    assignJersey(player, team[side], candidates, teamName);
                

                if (wasRenumbered) {
                    resolveDuplicates(team[side]);
                }

                stats.checked++;

                if (wasRenumbered) {

                    stats.duplicateResolutions++;

                    if (selectedCandidateIndex >= fallbackStartIndex) {

                        stats.fallbackRenumbers++;

                        console.log("\n==================== FALLBACK USED ====================");

                        console.log(
                            `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position})`
                        );

                        console.log(`Original Jersey : #${oldNumber}`);
                        console.log(`Fallback Jersey : #${player.JerseyNum}`);

                        console.log("=======================================================\n");

                    } else {

                        stats.preferredRenumbers++;

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

                if (reason.duplicate)
                    continue;

                if (!reason.suboptimal && !reason.promotion)
                    continue;

                const { candidates, fallbackStartIndex } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber } =
                    assignJersey(player, team[side], candidates, teamName);

                stats.checked++;

                if (wasRenumbered) {

                    if (reason.suboptimal) {
                        stats.suboptimalCorrections++;
                    } else {
                        stats.promotions++;
                    }

                    if (selectedCandidateIndex >= fallbackStartIndex) {

                        stats.fallbackRenumbers++;

                        console.log("\n==================== FALLBACK USED ====================");

                        console.log(
                            `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position})`
                        );

                        console.log(`Original Jersey : #${oldNumber}`);
                        console.log(`Fallback Jersey : #${player.JerseyNum}`);

                        console.log("=======================================================\n");

                    } else {

                        stats.preferredRenumbers++;

                    }

                    console.log(
                        `${teamName} | ${player.FirstName} ${player.LastName} (${player.Position}) : #${oldNumber} -> #${player.JerseyNum}`
                    );

                } else {

                    stats.unchanged++;

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
                    console.log(
                        `FINAL DUPLICATE: ${teamName} ${side} #${player.JerseyNum}
            ${other.FirstName} ${other.LastName}
            ${player.FirstName} ${player.LastName}`
                    );
                }

                seen.set(player.JerseyNum, player);
            }
        }
    }

    return { stats, initialSuboptimal };
}

function printSummary(initialSuboptimal, stats) {
    console.log("Renumbering complete.");
    console.log("Generating summary...");

    console.log("\n====================================");
    console.log("Initial Analysis");
    console.log("====================================");
    console.log(`Players Outside Preferred Range : ${initialSuboptimal}`);

    console.log("\n====================================");
    console.log("ReNumbering Summary");
    console.log("====================================");
    // console.log(`Players ReNumber Tries : ${stats.checked}`);
    console.log(`Duplicate Resolutions  : ${stats.duplicateResolutions}`);
    console.log(`Number Promotions      : ${stats.promotions}`);
    console.log(`Suboptimal Corrections : ${stats.suboptimalCorrections}`);
    console.log(`Total Jersey Changes   : ${stats.preferredRenumbers}`);
    console.log(`Fallback ReNumbers     : ${stats.fallbackRenumbers}`);
    console.log(`Unable to Improve      : ${stats.unchanged}`);
}

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

async function askRetry() {
    while (true) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });

        console.log("\n====================================");
        console.log("Finished");
        console.log("====================================");
        console.log("1. Run Again");
        console.log("2. Exit\n");

        const choice = await new Promise(resolve => {
            rl.question("Choice: ", answer => {
                rl.close();
                resolve(answer.trim());
            });
        });

        if (choice === "1") {
            return true;
        }

        if (choice === "2") {
            console.log("\nGoodbye! Closing application.");

            await sleep(2500); // Wait 3 seconds

            process.exit(0);
        }

        console.log("\nInvalid selection.");
    }
}

// ======================================================
// Main Entry Point
// ======================================================

async function main() {
    while (true) {
        try {
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
            await sleep(1600);

            console.log("Finding dynasty saves...");
            await sleep(800);
            const savePath = resolveSavePath();
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

            const proceed = await askYesNo("Would you like to continue?");
            if (!proceed) {
                console.log("\nOperation cancelled.");
                console.log("No changes were made.");
                return;
            }
            await sleep(750);

            const renumberUserTeams = await askYesNo("ReNumber user-controlled teams as well?");
            await sleep(750);

            const backupPath = createBackup(savePath);
            console.log("\n✓ Backup created");
            console.log(`Location: ${backupPath}\n`);
            await sleep(100);
            console.log("To restore it later, rename the backup back to its original filename...\n");
            await sleep(3500);

            const franchise = await openSave(savePath);
            console.log("Save opened successfully.");
            await sleep(1000);

            console.log("Reading Player table...");
            const players = await readTable(franchise, "Player");
            await sleep(800);
            console.log(`Loaded ${players.records.length} players.`);
            await sleep(800);

            console.log("Reading Team table...");
            const teams = await readTable(franchise, "Team");
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

            for (const player of players.records) {
                player.wasRenumberedThisRun = false;
            }

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
            
            // console.log("Saving is currently disabled.");
            // console.log("No changes were written to disk.\n");

            if (!(await askRetry())) {
                return;
            }

            console.clear();
        } catch (err) {
            console.error("\nERROR:\n");
            console.error(err);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            await new Promise(resolve => {
                rl.question("\nPress Enter to exit...", () => {
                    rl.close();
                    resolve();
                });
            });
            return;
        }
    }
}


// Run the program
main();
      