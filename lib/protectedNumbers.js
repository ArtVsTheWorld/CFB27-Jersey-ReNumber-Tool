// Protected Numbers: school-specific jersey numbers that should not be
// assigned by ordinary roster generation, plus related non-blocking statuses.

export const PROTECTED_NUMBER_STATUS = Object.freeze({
    UNAVAILABLE: "unavailable",
    LEGACY_PERMISSION_REQUIRED: "legacy_permission_required",
    ANNUAL_HONOR: "annual_honor",
    HONORED_REUSABLE: "honored_reusable",
    TEMPORARILY_WITHHELD: "temporarily_withheld",
    POSITION_TRADITION: "position_tradition"
});

const BLOCKED_STATUSES = new Set([
    PROTECTED_NUMBER_STATUS.UNAVAILABLE,
    PROTECTED_NUMBER_STATUS.LEGACY_PERMISSION_REQUIRED,
    PROTECTED_NUMBER_STATUS.TEMPORARILY_WITHHELD
]);

const STATUS_LABELS = {
    [PROTECTED_NUMBER_STATUS.UNAVAILABLE]: "unavailable number",
    [PROTECTED_NUMBER_STATUS.LEGACY_PERMISSION_REQUIRED]: "legacy number requires permission",
    [PROTECTED_NUMBER_STATUS.TEMPORARILY_WITHHELD]: "temporarily withheld number"
};

function rule(teamNames, numbers, status, note) {
    return { teamNames, numbers, status, note };
}

export const PROTECTED_NUMBER_RULES = [
    // SEC
    rule(["LSU", "Louisiana State"], [20], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Billy Cannon"),
    rule(["LSU", "Louisiana State"], [7, 18], PROTECTED_NUMBER_STATUS.ANNUAL_HONOR, "annual LSU tradition number"),
    rule(["LSU", "Louisiana State"], [21, 37], PROTECTED_NUMBER_STATUS.HONORED_REUSABLE, "honored LSU jersey, still reusable"),
    rule(["Arkansas", "Arkansas Razorbacks"], [12, 77], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Clyde Scott and Brandon Burlsworth"),
    rule(["Auburn", "Auburn Tigers"], [2, 7, 34, 88], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Auburn football numbers"),
    rule(["Georgia", "Georgia Bulldogs"], [21, 34, 40, 62], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Georgia football numbers"),
    rule(["Ole Miss", "Mississippi", "Ole Miss Rebels"], [10, 18, 74], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Ole Miss football numbers"),
    rule(["Ole Miss", "Mississippi", "Ole Miss Rebels"], [38], PROTECTED_NUMBER_STATUS.ANNUAL_HONOR, "Chucky Mullins Courage Award"),
    rule(["Tennessee", "Tennessee Volunteers"], [16, 32, 45, 49, 61, 62, 91, 92], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Tennessee football numbers"),
    rule(["Texas", "Texas Longhorns"], [10, 12, 20, 22, 34, 60], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Texas football numbers"),

    // Big Ten
    rule(["Illinois", "Illinois Fighting Illini"], [50, 77], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Illinois football numbers"),
    rule(["Indiana", "Indiana Hoosiers"], [32], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Indiana football number"),
    rule(["Iowa", "Iowa Hawkeyes"], [24, 62], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Iowa football numbers"),
    rule(["Michigan", "Michigan Wolverines"], [11, 21, 47, 48, 87, 98], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "re-retired Michigan football numbers"),
    rule(["Michigan", "Michigan Wolverines"], [1], PROTECTED_NUMBER_STATUS.POSITION_TRADITION, "receiver lineage number"),
    rule(["Nebraska", "Nebraska Cornhuskers"], [20, 60, 64], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "permanently retired Nebraska football numbers"),
    rule(["Ohio State", "Ohio St", "Ohio State Buckeyes"], [22, 27, 31, 40, 45, 47, 99], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Ohio State football numbers"),
    rule(["Penn State", "Penn St", "Penn State Nittany Lions"], [22], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Penn State football number"),
    rule(["Rutgers", "Rutgers Scarlet Knights"], [52], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Rutgers football number"),
    rule(["UCLA", "UCLA Bruins"], [5, 8, 13, 16, 34, 38, 42, 79, 80, 84], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired UCLA football numbers"),
    rule(["USC", "Southern California", "Southern Cal", "USC Trojans"], [3, 5, 11, 12, 13, 20, 32, 33], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "protected USC Heisman numbers"),
    rule(["USC", "Southern California", "Southern Cal", "USC Trojans"], [55], PROTECTED_NUMBER_STATUS.POSITION_TRADITION, "linebacker lineage number"),
    rule(["Wisconsin", "Wisconsin Badgers"], [33, 35, 40, 80, 83, 88], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Wisconsin football numbers"),

    // ACC
    rule(["Boston College", "BC", "Boston College Eagles"], [22, 68], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Boston College football numbers"),
    rule(["California", "Cal", "California Golden Bears"], [12], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Joe Roth"),
    rule(["Clemson", "Clemson Tigers"], [66], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Banks McFadden"),
    rule(["Clemson", "Clemson Tigers"], [4, 28], PROTECTED_NUMBER_STATUS.LEGACY_PERMISSION_REQUIRED, "reissuable only with honoree permission"),
    rule(["Georgia Tech", "Georgia Tech Yellow Jackets"], [19], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Clint Castleberry"),
    rule(["Louisville", "Louisville Cardinals"], [8, 16], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Louisville football numbers"),
    rule(["Miami", "Miami FL", "Miami Hurricanes"], [10, 14, 42, 89], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Miami football numbers"),
    rule(["NC State", "North Carolina State", "NC State Wolfpack"], [17, 18, 23, 40, 51, 63, 77, 81], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired NC State football numbers"),
    rule(["North Carolina", "UNC", "North Carolina Tar Heels"], [22, 46, 50, 59, 99], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired North Carolina football numbers"),
    rule(["Pitt", "Pittsburgh", "Pittsburgh Panthers"], [1, 13, 33, 42, 65, 73, 75, 79, 89, 97, 99], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Pitt football numbers"),
    rule(["Stanford", "Stanford Cardinal"], [1, 7, 16], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Stanford football numbers"),
    rule(["Syracuse", "Syracuse Orange"], [44], PROTECTED_NUMBER_STATUS.LEGACY_PERMISSION_REQUIRED, "functionally protected legacy number"),
    rule(["Virginia", "Virginia Cavaliers"], [12, 24, 35, 48, 73, 97], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Virginia football numbers"),
    rule(["Virginia Tech", "VT", "Virginia Tech Hokies"], [10, 73, 78, 84], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Virginia Tech football numbers"),
    rule(["Virginia Tech", "VT", "Virginia Tech Hokies"], [25], PROTECTED_NUMBER_STATUS.ANNUAL_HONOR, "Beamer 25 weekly honoree"),

    // Big 12
    rule(["Arizona State", "ASU", "Arizona State Sun Devils"], [11, 27, 33, 40, 42], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Arizona State football numbers"),
    rule(["BYU", "Brigham Young", "BYU Cougars"], [6, 8, 9, 14, 40, 81], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired BYU football numbers"),
    rule(["Houston", "Houston Cougars"], [7, 11, 23, 78], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Houston football numbers"),
    rule(["Iowa State", "Iowa State Cyclones"], [30], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Iowa State football number"),
    rule(["Kansas", "Kansas Jayhawks"], [21, 42, 48], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Kansas football numbers"),
    rule(["Kansas State", "K-State", "Kansas State Wildcats"], [11], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Kansas State football number"),
    rule(["Oklahoma State", "Oklahoma St", "Oklahoma State Cowboys"], [21, 34, 43, 55], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Oklahoma State football numbers"),
    rule(["TCU", "Texas Christian", "TCU Horned Frogs"], [5, 8, 45], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired TCU football numbers"),
    rule(["Texas Tech", "Texas Tech Red Raiders"], [44, 55, 81], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Texas Tech football numbers"),
    rule(["Utah", "Utah Utes"], [22], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Ty Jordan and Aaron Lowe memorial"),
    rule(["West Virginia", "WVU", "West Virginia Mountaineers"], [9, 21, 75, 77, 90], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired West Virginia football numbers"),

    // Pac-12 remnants, service academies, and special cases
    rule(["Colorado", "Colorado Buffaloes"], [19], PROTECTED_NUMBER_STATUS.TEMPORARILY_WITHHELD, "temporarily withheld"),
    rule(["Colorado", "Colorado Buffaloes"], [11, 24, 67], PROTECTED_NUMBER_STATUS.HONORED_REUSABLE, "legacy policy allows reuse"),
    rule(["Oregon State", "Oregon State Beavers"], [11], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Oregon State football number"),
    rule(["Washington State", "Washington State Cougars"], [7, 14], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Washington State football numbers"),
    rule(["Army", "Army West Point", "Army Black Knights"], [24, 35, 41, 61], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Army football numbers"),
    rule(["Navy", "Navy Midshipmen"], [12, 19, 27, 30], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Navy football numbers"),

    // Notable Group of Five examples
    rule(["Appalachian State", "App State", "Appalachian State Mountaineers"], [14, 23, 32, 38, 71], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Appalachian State football numbers"),
    rule(["Boise State", "Boise State Broncos"], [12], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Boise State football number"),
    rule(["Colorado State", "Colorado State Rams"], [14, 21, 48], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Colorado State football numbers"),
    rule(["East Carolina", "ECU", "East Carolina Pirates"], [16, 18, 29, 36], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired East Carolina football numbers"),
    rule(["Fresno State", "Fresno State Bulldogs"], [4, 8, 9, 12, 14, 15, 21, 22, 83], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Fresno State football numbers"),
    rule(["Hawaii", "Hawai'i", "Hawaii Rainbow Warriors"], [15, 32], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Hawaii football numbers"),
    rule(["Memphis", "Memphis Tigers"], [8, 20, 30, 59, 64, 79, 83], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Memphis football numbers"),
    rule(["San Diego State", "SDSU", "San Diego State Aztecs"], [8, 25, 28], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired San Diego State football numbers"),
    rule(["Southern Miss", "Southern Mississippi", "Southern Miss Golden Eagles"], [4, 10, 44], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Southern Miss football numbers"),
    rule(["Tulsa", "Tulsa Golden Hurricane"], [14, 17, 31, 36, 45, 55, 64, 81, 83], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "retired Tulsa football numbers"),
    rule(["Wyoming", "Wyoming Cowboys"], [17], PROTECTED_NUMBER_STATUS.UNAVAILABLE, "Josh Allen")
];

function normalizeTeamName(name) {
    return String(name ?? "").trim().toLowerCase();
}

export function getProtectedNumberRules(teamName) {
    const normalized = normalizeTeamName(teamName);
    return PROTECTED_NUMBER_RULES.filter(rule =>
        rule.teamNames.some(name => normalizeTeamName(name) === normalized)
    );
}

export function isBlockedProtectedStatus(status) {
    return BLOCKED_STATUSES.has(status);
}

function getBlockedNumberMap(teamName) {
    const map = new Map();

    for (const protectedRule of getProtectedNumberRules(teamName)) {
        if (!isBlockedProtectedStatus(protectedRule.status)) continue;
        for (const number of protectedRule.numbers) {
            map.set(number, {
                number,
                status: protectedRule.status,
                note: protectedRule.note
            });
        }
    }

    return map;
}

export function applyProtectedNumbersToTeamGroups(teamGroups, teamNames) {
    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;
        const blockedNumberMap = getBlockedNumberMap(teamName);
        const rosters = team.all ? [team.all] : [team.offense ?? [], team.defense ?? []];

        for (const roster of rosters) {
            for (const player of roster) {
                player.protectedNumberRules = blockedNumberMap;
            }
        }
    }
}

export function isBlockedNumberForPlayer(player, number) {
    return player.protectedNumberRules?.has(Number(number)) === true;
}

export function getBlockedNumberReason(player, number = player.JerseyNum) {
    const entry = player.protectedNumberRules?.get(Number(number));
    if (!entry) return null;

    const statusLabel = STATUS_LABELS[entry.status] ?? "protected number";
    return entry.note ? `${statusLabel}: ${entry.note}` : statusLabel;
}
