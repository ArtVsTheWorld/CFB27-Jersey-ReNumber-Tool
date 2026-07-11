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


const readline = require("readline");

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
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise(resolve => {
        rl.question(`${question} (Y/N): `, answer => {
            rl.close();
            const normalized = answer.trim().toLowerCase();
            resolve(normalized === "y" || normalized === "yes");
        });
    });
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
        promoted: 0,
        duplicateFixes: 0,
        preferredRenumbers: 0,
        fallbackRenumbers: 0,
        unchanged: 0
    };
}

function assignJersey(player, roster, candidates) {
    let firstAvailable = null;
    let selectedCandidateIndex = -1;

    for (let i = 0; i < candidates.length; i++) {
        const number = candidates[i];
        if (isNumberAvailable(player, number, roster)) {
            firstAvailable = number;
            selectedCandidateIndex = i;
            break;
        }
    }

    const oldNumber = player.JerseyNum;
    let wasRenumbered = false;

    if (firstAvailable !== null) {
        player.JerseyNum = firstAvailable;
        player.mustRenumberDuplicate = false;
        wasRenumbered = true;
    }

    return {
        wasRenumbered,
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
            for (const player of team[side]) {
                needsRenumber(player);
                const reason = getRenumberReason(player);

                if (reason.suboptimal) {
                    initialSuboptimal++;
                }

                if (!reason.suboptimal && !reason.promotion && !reason.duplicate) {
                    continue;
                }

                const { candidates, fallbackStartIndex } = generateCandidates(player);
                const { wasRenumbered, selectedCandidateIndex, oldNumber } = assignJersey(player, team[side], candidates);

                stats.checked++;
                if (wasRenumbered) {
                    if (reason.promotion) {
                        stats.promoted++;
                    } else if (reason.duplicate) {
                        stats.duplicateFixes++;
                    } else if (selectedCandidateIndex >= fallbackStartIndex) {
                        stats.fallbackRenumbers++;
                    } else {
                        stats.preferredRenumbers++;
                    }
                } else {
                    stats.unchanged++;
                }

                console.log(`${teamName} | ${player.FirstName} ${player.LastName} | ${player.Position}`);
                if (wasRenumbered) {
                    console.log(`   Jersey : ${oldNumber} -> ${player.JerseyNum}`);
                } else {
                    console.log(`   Jersey : Stayed at #${oldNumber}`);
                }
                console.log(`   Favorite Numbers : ${candidates.slice(0, 20).join(", ")}`);
                console.log();

                await sleep(1);
            }
        }
    }

    return { stats, initialSuboptimal };
}

function printSummary(initialSuboptimal, stats) {
    console.log("\nReNumbering completed successfully!");
    console.log("Reviewing Changes...");

    console.log("\n====================================");
    console.log("Initial Analysis");
    console.log("====================================");
    console.log(`Players Outside Preferred Range : ${initialSuboptimal}`);

    console.log("\n====================================");
    console.log("ReNumbering Summary");
    console.log("====================================");
    console.log(`Players Checked      : ${stats.checked}`);
    console.log(`Promotions           : ${stats.promoted}`);
    console.log(`Duplicate Fixes      : ${stats.duplicateFixes}`);
    console.log(`Preferred ReNumbers  : ${stats.preferredRenumbers}`);
    console.log(`Fallback ReNumbers   : ${stats.fallbackRenumbers}`);
    console.log(`Unchanged            : ${stats.unchanged}`);
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
    console.log("====================================");
    console.log(`Duplicate Jerseys : ${results.duplicateCount}`);
    console.log(`Players Left Using Unpreferred Numbers : ${results.unchangedCount}`);

    if (results.duplicateCount === 0) {
        console.log("✓ No duplicate jerseys detected.");
    } else {
        console.log(`✗ ${results.duplicateCount} duplicate jersey(s) detected.`);
    }

    if (results.unchangedCount === 0) {
        console.log("✓ Every player is wearing a preferred jersey.");
    } else {
        console.log(`✓ ${results.unchangedCount} player(s) are using fallback numbers.`);
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
            console.log("\nGoodbye! Feel free to close the application.");
            return false;
        }

        console.log("\nInvalid selection.");
    }
}

// Main function
async function main() {
    while (true) {
        try {
            console.log(`
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║            CFB 27 JERSEY RENUMBER TOOL                     ║
║                                                            ║
║                     Version 1.0                            ║
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
            console.log(`\nBackup created:\n${backupPath}\n`);
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

            const teamRosters = buildTeamRosters(players, userControlledTeams, renumberUserTeams, sortedTeamIndexes);
            const teamGroups = buildTeamGroups(teamRosters);
            sortAndResolveTeamGroups(teamGroups);

            console.log("Rosters Built!\n");
            await sleep(800);

            console.log("\nReNumbering Players Now...\n");
            await sleep(1000);
            const { stats, initialSuboptimal } = await processTeamGroups(teamGroups, teamNames);

            await sleep(1200);
            printSummary(initialSuboptimal, stats);

            await sleep(800);
            const validationResults = validateTeamGroups(teamGroups, teamNames);
            printValidationResults(validationResults);

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
      