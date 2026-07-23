import { generateCandidates } from "./candidateGenerator.js";
import { isNumberAvailable } from "./duplicateResolver.js";
import { logChange, logDisplacement, logInfo, logWarning, playerDetails, playerName } from "./logger.js";

const LINEBACKER_POSITIONS = ["LOLB", "MLB", "ROLB"];
const LSU_NUMBER_7_POSITIONS = ["HB", "WR", "TE", "LOLB", "MLB", "ROLB", "CB", "FS", "SS"];
const SINGLE_DIGIT_NUMBERS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const MIN_JERSEY = 0;
const MAX_JERSEY = 99;

const SIDE_GROUPS = [
    { key: "offense", label: "Offense" },
    { key: "defense", label: "Defense" }
];

const STATE_NAME_VALUES = {
    Louisiana: 17,
    Montana: 25
};

const PIPELINE_VALUES = {
    Louisiana: 14
};

const SCHOOL_YEAR_SCORE = {
    Freshman: 0,
    Sophomore: 8,
    Junior: 18,
    Senior: 30
};

const CAPTAIN_PATCH_SCORE = {
    None: 0,
    OneYear: 12,
    TwoYear: 24,
    ThreeYear: 36,
    FourYear: 48,
    FiveYearGold: 60
};

const ABILITY_RANK_SCORE = {
    None: 0,
    Bronze: 3,
    Silver: 6,
    Gold: 9,
    Platinum: 12
};

const DEV_TRAIT_SCORE = {
    Normal: 0,
    College_Impact: 12,
    Star: 12,
    College_Star: 20,
    Superstar: 20,
    College_Elite: 30,
    XFactor: 30,
    Hidden: 8
};

const TEAM_PLAYER_MENTAL_ABILITIES = new Set(["Captain", "TeamPlayer", "Toughness", "FieldGeneral", "BestFriend"]);
const TOUGHNESS_MENTAL_ABILITIES = new Set(["Toughness", "Headstrong", "Adrenaline", "WinningTime"]);

// Team-specific traditions are data-driven so additional schools can be added
// without changing the assignment algorithm.
export const TEAM_RULES = [
    {
        teamNames: ["LSU", "Louisiana State"],
        number: 7,
        label: "LSU #7 tradition",
        positions: LSU_NUMBER_7_POSITIONS,
        scorer: "playmaker"
    },
    {
        teamNames: ["LSU", "Louisiana State"],
        number: 18,
        label: "LSU #18 tradition",
        schoolYears: ["Senior", "Junior"],
        homeStates: ["Louisiana"],
        classPriority: [
            { schoolYear: "Senior", redshirtStatus: "Previous" },
            { schoolYear: "Senior" },
            { schoolYear: "Junior", redshirtStatus: "Previous" },
            { schoolYear: "Junior" }
        ],
        scorer: "leadership"
    },
    {
        teamNames: ["Texas A&M", "Texas A&M Aggies", "Texas AM", "Texas AandM"],
        number: 12,
        label: "Texas A&M #12 12th Man",
        excludePositions: ["QB"],
        scorer: "specialTeams"
    },
    {
        teamNames: ["Ole Miss", "Mississippi"],
        number: 38,
        label: "Ole Miss #38 Chucky Mullins Courage Award",
        side: "defense",
        scorer: "courage"
    },
    {
        teamNames: ["Ohio State", "Ohio St", "Ohio State Buckeyes"],
        number: 0,
        label: "Ohio State #0 Block O",
        scorer: "leadership"
    },
    {
        teamNames: ["NC State", "North Carolina State"],
        number: 1,
        label: "NC State #1 Alpha Wolf",
        scorer: "leadership"
    },
    {
        teamNames: ["Northwestern", "Northwestern Wildcats"],
        number: 1,
        label: "Northwestern #1 tradition",
        scorer: "institutionalLeadership"
    },
    {
        teamNames: ["Virginia Tech", "VT", "Virginia Tech Hokies"],
        number: 25,
        label: "Virginia Tech Beamer 25",
        excludePositions: ["QB"],
        scorer: "specialTeams"
    },
    {
        teamNames: ["Montana", "Montana Grizzlies"],
        number: 37,
        label: "Montana #37 Spirit of Montana",
        homeStates: ["Montana"],
        scorer: "homeStateLegacy"
    },
    {
        teamNames: ["Montana State", "Montana State Bobcats"],
        number: 41,
        label: "Montana State #41 legacy",
        schoolYears: ["Senior"],
        homeStates: ["Montana"],
        scorer: "homeStateLegacy"
    },
    {
        teamNames: ["Georgetown", "Georgetown Hoyas"],
        number: 35,
        label: "Georgetown #35 Joe Eacobacci memorial",
        scorer: "courage"
    },
    {
        teamNames: ["Penn State", "Penn St", "Penn State Nittany Lions"],
        number: 0,
        label: "Penn State #0 special teams leader",
        excludePositions: ["QB"],
        scorer: "specialTeams"
    },
    {
        teamNames: ["Temple", "Temple Owls"],
        numberPool: SINGLE_DIGIT_NUMBERS,
        awardCount: 10,
        label: "Temple single-digit tradition",
        scorer: "leadership"
    },
    {
        teamNames: ["Baylor", "Baylor Bears"],
        numberPool: SINGLE_DIGIT_NUMBERS,
        awardCount: 10,
        label: "Baylor single-digit tradition",
        scorer: "leadership"
    },
    {
        teamNames: ["USC", "Southern California", "Southern Cal"],
        number: 55,
        label: "USC #55 linebacker lineage",
        positions: LINEBACKER_POSITIONS,
        scorer: "lineagePlaymaker"
    },
    {
        teamNames: ["Penn State", "Penn St", "Penn State Nittany Lions"],
        number: 11,
        label: "Penn State #11 Linebacker U lineage",
        positions: LINEBACKER_POSITIONS,
        scorer: "lineagePlaymaker"
    },
    {
        teamNames: ["Michigan", "Michigan Wolverines"],
        number: 1,
        label: "Michigan #1 receiver lineage",
        positions: ["WR"],
        scorer: "lineagePlaymaker"
    },
    {
        teamNames: ["Syracuse", "Syracuse Orange"],
        number: 44,
        label: "Syracuse #44 retired legacy",
        reserveOnly: true
    },
    {
        teamNames: ["Army", "Army West Point", "Army Black Knights"],
        number: 12,
        label: "Army #12 Corps of Cadets reserve",
        reserveOnly: true
    }
];

// Normalize display names before matching aliases from the team table.
function normalizeTeamName(name) {
    return String(name ?? "").trim().toLowerCase();
}

// Return every configured tradition for a team.
function findRules(teamName) {
    const normalized = normalizeTeamName(teamName);
    return TEAM_RULES.filter(rule => rule.teamNames.some(name => normalizeTeamName(name) === normalized));
}

function reservedNumbersForRule(rule) {
    if (rule.numberPool) return rule.numberPool;
    if (rule.number !== undefined) return [rule.number];
    return [];
}

function reserveRuleNumbersForTeam(team, rules) {
    const roster = team.all ?? [...team.offense, ...team.defense];
    const reservedNumbers = new Set(rules.flatMap(rule => reservedNumbersForRule(rule)));

    for (const player of roster) {
        if (!player.teamRuleReservedNumbers) player.teamRuleReservedNumbers = new Set();
        for (const number of reservedNumbers) player.teamRuleReservedNumbers.add(number);
    }
}

function toNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
}

function isTruthy(value) {
    return value === true || value === 1 || String(value).toLowerCase() === "true";
}

function normalizeEnumValue(value) {
    if (value === null || value === undefined) return "";
    if (typeof value === "object" && "name" in value) return normalizeEnumValue(value.name);
    const text = String(value).trim();
    return text.includes(":") ? text.split(":").pop() : text;
}

function enumScore(value, scoreMap) {
    return scoreMap[normalizeEnumValue(value)] ?? 0;
}

function hasEnumValue(player, fields, values) {
    const allowed = new Set(values);
    return fields.some(field => allowed.has(normalizeEnumValue(player[field])));
}

function sumStatsValue(value, fields) {
    if (!value) return 0;
    if (Array.isArray(value)) return value.reduce((sum, item) => sum + sumStatsValue(item, fields), 0);

    let sum = 0;
    for (const field of fields) {
        let directValue;
        try {
            directValue = value[field];
        } catch {
            directValue = undefined;
        }

        if (directValue !== undefined && directValue !== null) {
            sum += toNumber(directValue);
        } else if (typeof value.getValueByKey === "function") {
            sum += toNumber(value.getValueByKey(field));
        }
    }
    return sum;
}

function stat(player, fields) {
    const fieldList = Array.isArray(fields) ? fields : [fields];
    return [
        player,
        player.SeasonStats,
        player.CareerStats,
        player.GameStats
    ].reduce((sum, value) => sum + sumStatsValue(value, fieldList), 0);
}

function schoolYearScore(player) {
    const schoolYear = normalizeEnumValue(player.SchoolYear);
    const redshirtBonus = normalizeEnumValue(player.RedshirtStatus) === "Previous" ? 4 : 0;
    return (SCHOOL_YEAR_SCORE[schoolYear] ?? 0) + redshirtBonus;
}

function captainScore(player) {
    let score = 0;
    if (isTruthy(player.PLYR_ISCAPTAIN)) score += 60;
    score += enumScore(player.CaptainsPatch, CAPTAIN_PATCH_SCORE);

    for (let i = 1; i <= 3; i++) {
        const ability = normalizeEnumValue(player[`MentalAbility${i}`]);
        const rank = enumScore(player[`MentalAbilityRank${i}`], ABILITY_RANK_SCORE);
        if (ability === "Captain") score += 28 + rank;
        else if (ability === "TeamPlayer") score += 20 + rank;
        else if (ability === "FieldGeneral") score += 16 + rank;
        else if (ability === "BestFriend") score += 12 + rank;
    }

    const personality = normalizeEnumValue(player.Personality);
    if (personality === "Leader") score += 28;
    else if (personality === "TeamPlayer") score += 18;
    else if (personality === "Intense") score += 6;

    return score;
}

function toughnessTraitScore(player) {
    let score = toNumber(player.ToughnessRating) * 0.75;
    score += toNumber(player.StaminaRating) * 0.25;
    score += toNumber(player.StrengthRating) * 0.15;

    for (let i = 1; i <= 3; i++) {
        const ability = normalizeEnumValue(player[`MentalAbility${i}`]);
        const rank = enumScore(player[`MentalAbilityRank${i}`], ABILITY_RANK_SCORE);
        if (TOUGHNESS_MENTAL_ABILITIES.has(ability)) score += 14 + rank;
    }

    if (isTruthy(player.WasPreviouslyInjured)) score += Math.min(10, toNumber(player.TotalInjuryDuration) / 8);
    if (isTruthy(player.IsInjuredReserve)) score -= 80;
    return score;
}

function experienceScore(player) {
    return schoolYearScore(player) +
        toNumber(player.PLYR_CONSECYEARSWITHTEAM) * 8 +
        stat(player, "GAMESSTARTED") * 2.5 +
        stat(player, "GAMESPLAYED") * 1.2 +
        stat(player, "DOWNSPLAYED") / 120;
}

function teamPlayerMentalScore(player) {
    let score = 0;
    for (let i = 1; i <= 3; i++) {
        const ability = normalizeEnumValue(player[`MentalAbility${i}`]);
        const rank = enumScore(player[`MentalAbilityRank${i}`], ABILITY_RANK_SCORE);
        if (TEAM_PLAYER_MENTAL_ABILITIES.has(ability)) score += 8 + rank;
    }
    return score;
}

function leadershipScoreBreakdown(player) {
    const parts = {
        captain: captainScore(player),
        experience: experienceScore(player),
        awareness: toNumber(player.AwarenessRating) * 0.8,
        toughness: toNumber(player.ToughnessRating) * 0.65,
        confidence: toNumber(player.ConfidenceRating) * 0.45,
        overall: toNumber(player.OverallRating) * 0.12,
        mental: teamPlayerMentalScore(player)
    };

    parts.total = Object.values(parts).reduce((sum, value) => sum + value, 0);
    return parts;
}

function leadershipScore(player) {
    return leadershipScoreBreakdown(player).total;
}

function institutionalLeadershipScore(player) {
    return leadershipScore(player) - toNumber(player.OverallRating) * 0.08 + toNumber(player.PLYR_CONSECYEARSWITHTEAM) * 4;
}

function offensiveProductionScore(player) {
    switch (player.Position) {
        case "QB":
            return stat(player, "PASSYARDS") / 35 +
                stat(player, "PASSTDS") * 6 +
                stat(player, "4QCOMEBACKS") * 8 +
                stat(player, "QBSCRAMBLE_YARDS") / 35 -
                stat(player, "PASSINTS") * 4;
        case "HB":
            return stat(player, "RUSHYARDS") / 12 +
                stat(player, "RUSHTDS") * 6 +
                stat(player, "RUSHBROKENTACKLES") * 1.5 +
                stat(player, "RECEIVEYARDS") / 25 -
                stat(player, "RUSHFUMBLES") * 3;
        case "WR":
        case "TE":
            return stat(player, "RECEIVEYARDS") / 12 +
                stat(player, "RECEIVETDS") * 6 +
                stat(player, "RECEIVECATCHES") * 1.2 +
                stat(player, "RECEIVEYARDSAFTER") / 25 -
                stat(player, "RECEIVEDROPS") * 2;
        default:
            return 0;
    }
}

function defensiveProductionScore(player) {
    const tackles = stat(player, ["DEFTACKLES", "ASSDEFTACKLES"]);
    const disruptivePlays = stat(player, "DEFTACKLESFORLOSS") * 4 +
        stat(player, "DLINESACKS") * 7 +
        stat(player, "DLINEHALFSACK") * 3.5 +
        stat(player, "DLINEFORCEDFUMBLES") * 6 +
        stat(player, "DLINEFUMBLERECOVERIES") * 4 +
        stat(player, "DLINEBLOCKS") * 4;
    const coveragePlays = stat(player, "DSECINTS") * 9 +
        stat(player, "DSECINTTDS") * 12 +
        stat(player, "DEFPASSDEFLECTIONS") * 3.5;

    if (LINEBACKER_POSITIONS.includes(player.Position)) return tackles * 1.4 + disruptivePlays + coveragePlays;
    if (["LE", "RE", "DT"].includes(player.Position)) return tackles + disruptivePlays * 1.25;
    if (["CB", "FS", "SS"].includes(player.Position)) return tackles * 0.8 + coveragePlays * 1.3;
    return tackles + disruptivePlays + coveragePlays;
}

function positionProductionScore(player) {
    return offensiveProductionScore(player) + defensiveProductionScore(player);
}

function playmakerScore(player) {
    let score = toNumber(player.OverallRating) * 2;
    score += positionProductionScore(player);
    score += enumScore(player.TraitDevelopment, DEV_TRAIT_SCORE);
    score += toNumber(player.YearlyAwardCount) * 18;
    score += toNumber(player.SpeedRating) * 0.15;
    score += toNumber(player.AccelerationRating) * 0.15;
    score += stat(player, "GAMERATING") / 20;
    if (isTruthy(player.IsImpactPlayer)) score += 30;
    return score;
}

function specialTeamsScore(player) {
    let score = 0;
    score += stat(player, "KRETATTEMPTS") * 2;
    score += stat(player, "KRETYARDS") / 12;
    score += stat(player, "KRETTDS") * 12;
    score += stat(player, "PRETATTEMPTS") * 2;
    score += stat(player, "PRETYARDS") / 10;
    score += stat(player, "PRETTDS") * 12;

    score += toNumber(player.KickReturnRating) * 0.75;
    score += toNumber(player.LongSnapRating) * 0.25;
    score += toNumber(player.TackleRating) * 0.45;
    score += toNumber(player.PursuitRating) * 0.4;
    score += toNumber(player.SpeedRating) * 0.35;
    score += toNumber(player.AccelerationRating) * 0.35;
    score += toNumber(player.StaminaRating) * 0.25;
    score += toNumber(player.ToughnessRating) * 0.35;
    score += stat(player, "GAMESPLAYED") * 1.6;
    score += stat(player, "DOWNSPLAYED") / 150;
    score -= stat(player, "GAMESSTARTED") * 3.5;

    if (hasEnumValue(player, ["Personality"], ["TeamPlayer"])) score += 18;
    for (let i = 1; i <= 3; i++) {
        const ability = normalizeEnumValue(player[`MentalAbility${i}`]);
        if (ability === "TeamPlayer" || ability === "Toughness") score += 12;
    }

    if (isTruthy(player.IsImpactPlayer)) score -= 20;
    if (toNumber(player.OverallRating) > 85) score -= (toNumber(player.OverallRating) - 85) * 4;
    if (player.Position === "QB") score -= 120;
    return score;
}

function courageScore(player) {
    return leadershipScore(player) * 0.85 +
        toughnessTraitScore(player) * 1.15 +
        toNumber(player.AwarenessRating) * 0.35 +
        toNumber(player.PLYR_CONSECYEARSWITHTEAM) * 5;
}

function homeStateLegacyScore(player) {
    return leadershipScore(player) * 0.65 +
        toughnessTraitScore(player) * 0.75 +
        toNumber(player.PLYR_CONSECYEARSWITHTEAM) * 10 +
        schoolYearScore(player) * 1.2 +
        toNumber(player.OverallRating) * 0.2;
}

function lineagePlaymakerScore(player) {
    return playmakerScore(player) + positionProductionScore(player) * 0.35 + leadershipScore(player) * 0.12;
}

const SCORERS = {
    overall: player => toNumber(player.OverallRating),
    leadership: leadershipScore,
    institutionalLeadership: institutionalLeadershipScore,
    playmaker: playmakerScore,
    specialTeams: specialTeamsScore,
    courage: courageScore,
    homeStateLegacy: homeStateLegacyScore,
    lineagePlaymaker: lineagePlaymakerScore
};

function currentHolderScore(player, rule, targetNumber) {
    if (targetNumber !== undefined) return player.JerseyNum === targetNumber ? 18 : 0;
    if (rule.numberPool?.includes(player.JerseyNum)) return 12;
    return 0;
}

function classPriorityRank(player, rule) {
    if (!rule.classPriority) return 0;

    const schoolYear = normalizeEnumValue(player.SchoolYear);
    const redshirtStatus = normalizeEnumValue(player.RedshirtStatus);
    const index = rule.classPriority.findIndex(priority =>
        priority.schoolYear === schoolYear &&
        (!priority.redshirtStatus || priority.redshirtStatus === redshirtStatus)
    );

    return index === -1 ? rule.classPriority.length : index;
}

function scorePlayer(player, rule, targetNumber) {
    const scorer = SCORERS[rule.scorer ?? "overall"] ?? SCORERS.overall;
    return scorer(player, rule) + currentHolderScore(player, rule, targetNumber);
}

// Rank recipients by the configured tradition score. Ties favor the current
// holder to avoid churn, then seniority, overall rating, and name.
function compareRecipients(a, b, rule, targetNumber) {
    const classDifference = classPriorityRank(a, rule) - classPriorityRank(b, rule);
    if (classDifference !== 0) return classDifference;

    const scoreDifference = scorePlayer(b, rule, targetNumber) - scorePlayer(a, rule, targetNumber);
    if (Math.abs(scoreDifference) > 0.0001) return scoreDifference;

    const aCurrent = currentHolderScore(a, rule, targetNumber);
    const bCurrent = currentHolderScore(b, rule, targetNumber);
    if (aCurrent !== bCurrent) return bCurrent - aCurrent;

    const yearDifference = schoolYearScore(b) - schoolYearScore(a);
    if (yearDifference !== 0) return yearDifference;

    const overallDifference = toNumber(b.OverallRating) - toNumber(a.OverallRating);
    if (overallDifference !== 0) return overallDifference;

    return playerName(a).localeCompare(playerName(b));
}

// Locate the offense or defense roster used for same-side availability checks.
function sideForPlayer(team, player) {
    if (team.offense.includes(player)) return team.offense;
    if (team.defense.includes(player)) return team.defense;
    return null;
}

// Build the roster groups a rule should evaluate.
function getRuleGroups(team, rule) {
    if (rule.awardBySide) {
        return SIDE_GROUPS.map(side => ({
            label: side.label,
            roster: team[side.key],
            replacementRosterFor: () => team[side.key]
        }));
    }

    if (rule.side) {
        return [{
            label: null,
            roster: team[rule.side],
            replacementRosterFor: () => team[rule.side]
        }];
    }

    const roster = team.all ?? [...team.offense, ...team.defense];
    return [{
        label: null,
        roster,
        replacementRosterFor: holder => sideForPlayer(team, holder) ?? roster
    }];
}

function matchesStateValue(rawValue, states) {
    const normalized = normalizeEnumValue(rawValue);
    if (states.includes(normalized)) return true;
    if (normalized === "") return false;

    const numericValue = Number(normalized);
    return Number.isInteger(numericValue) && states.some(state => STATE_NAME_VALUES[state] === numericValue);
}

function matchesPipelineValue(rawValue, pipelines) {
    const normalized = normalizeEnumValue(rawValue);
    if (pipelines.includes(normalized)) return true;
    if (normalized === "") return false;

    const numericValue = Number(normalized);
    return Number.isInteger(numericValue) && pipelines.some(pipeline => PIPELINE_VALUES[pipeline] === numericValue);
}

function matchesHomeState(player, homeStates) {
    if (!homeStates) return true;
    return [player.PLYR_HOME_STATE, player.HomeState].some(value => matchesStateValue(value, homeStates));
}

function matchesHomePipeline(player, homePipelines) {
    if (!homePipelines) return true;
    return matchesPipelineValue(player.HomePipeline, homePipelines);
}

function getRuleEligibilityFailures(player, rule) {
    const failures = [];
    if (player.IsNIL) failures.push("NIL");
    if (player.teamRuleLocked) failures.push("locked");
    if (rule.positions && !rule.positions.includes(player.Position)) failures.push("position");
    if (rule.excludePositions && rule.excludePositions.includes(player.Position)) failures.push("excludedPosition");
    if (rule.schoolYears && !rule.schoolYears.includes(normalizeEnumValue(player.SchoolYear))) failures.push("schoolYear");
    if (!matchesHomeState(player, rule.homeStates)) failures.push("homeState");
    if (!matchesHomePipeline(player, rule.homePipelines)) failures.push("homePipeline");
    return failures;
}

function matchesRuleEligibility(player, rule) {
    return getRuleEligibilityFailures(player, rule).length === 0;
}

function playerOriginDetails(player) {
    const homeState = normalizeEnumValue(player.PLYR_HOME_STATE) || normalizeEnumValue(player.HomeState) || "unknown";
    const homePipeline = normalizeEnumValue(player.HomePipeline) || "unknown";
    const homeTown = player.PLYR_HOME_TOWN ? `, ${player.PLYR_HOME_TOWN}` : "";
    return `state=${homeState}${homeTown}, pipeline=${homePipeline}`;
}

function diagnosticPlayerDetails(player, rule) {
    const failures = getRuleEligibilityFailures(player, rule);
    const reasonText = failures.length > 0 ? failures.join(", ") : "eligible";
    const lockedText = player.teamRuleLocked ? `, locked=#${player.teamRuleNumber}` : "";
    return `${playerDetails(player)} #${player.JerseyNum} | ${playerOriginDetails(player)}${lockedText} | ${reasonText}`;
}

function logEligibilityDiagnostics(teamName, ruleLabel, roster, rule) {
    const nonNil = roster.filter(player => !player.IsNIL);
    const positionMatches = nonNil.filter(player => !rule.positions || rule.positions.includes(player.Position));
    const excludedPositionMatches = positionMatches.filter(player => !rule.excludePositions || !rule.excludePositions.includes(player.Position));
    const yearMatches = excludedPositionMatches.filter(player => !rule.schoolYears || rule.schoolYears.includes(normalizeEnumValue(player.SchoolYear)));
    const stateMatches = yearMatches.filter(player => matchesHomeState(player, rule.homeStates));
    const pipelineMatches = stateMatches.filter(player => matchesHomePipeline(player, rule.homePipelines));
    const unlockedMatches = pipelineMatches.filter(player => !player.teamRuleLocked);
    const lockedMatches = pipelineMatches.filter(player => player.teamRuleLocked);

    const parts = [
        `roster=${roster.length}`,
        `nonNIL=${nonNil.length}`,
        rule.positions ? `position=${positionMatches.length}` : null,
        rule.excludePositions ? `notExcluded=${excludedPositionMatches.length}` : null,
        rule.schoolYears ? `schoolYear=${yearMatches.length}` : null,
        rule.homeStates ? `homeState=${stateMatches.length}` : null,
        rule.homePipelines ? `homePipeline=${pipelineMatches.length}` : null,
        `unlocked=${unlockedMatches.length}`
    ].filter(Boolean);

    logInfo(`TEAM RULE DIAGNOSTIC: ${teamName} | ${ruleLabel} | ${parts.join(" | ")}`);

    if (lockedMatches.length > 0) {
        for (const player of lockedMatches.slice(0, 3)) {
            logInfo(`  Would qualify but already locked: ${diagnosticPlayerDetails(player, rule)}`);
        }
    }

    const nearMisses = nonNil
        .filter(player => !unlockedMatches.includes(player))
        .sort((a, b) => compareRecipients(a, b, rule, rule.number))
        .slice(0, 5);

    for (const player of nearMisses) {
        logInfo(`  Near miss: ${diagnosticPlayerDetails(player, rule)}`);
    }
}

// Find a legal open number for a player who must vacate a reserved number.
function findReplacement(player, roster, reservedNumbers) {
    player.isPromotionAttempt = false;
    const blockedNumbers = new Set([...reservedNumbers, ...(player.teamRuleReservedNumbers ?? [])]);
    const { candidates } = generateCandidates(player);
    const replacement = candidates.find(number => !blockedNumbers.has(number) && isNumberAvailable(player, number, roster));
    if (replacement !== undefined) return replacement;

    for (let number = MIN_JERSEY; number <= MAX_JERSEY; number++) {
        if (!blockedNumbers.has(number) && isNumberAvailable(player, number, roster)) return number;
    }

    return undefined;
}

function getCurrentHolders(roster, recipient, targetNumber) {
    return roster.filter(player => player !== recipient && player.JerseyNum === targetNumber);
}

function canReserveNumber(group, recipient, targetNumber, reservedNumbers) {
    const currentHolders = getCurrentHolders(group.roster, recipient, targetNumber);
    if (currentHolders.some(player => player.IsNIL || player.teamRuleLocked)) return false;

    return currentHolders.every(holder => {
        const replacementRoster = group.replacementRosterFor(holder);
        return replacementRoster && findReplacement(holder, replacementRoster, reservedNumbers) !== undefined;
    });
}

function reserveNumber(teamName, ruleLabel, group, recipient, targetNumber, blockedNumbers, stats) {
    const roster = group.roster;
    const currentHolders = getCurrentHolders(roster, recipient, targetNumber);
    const protectedHolder = currentHolders.find(player => player.IsNIL || player.teamRuleLocked);

    if (protectedHolder) {
        stats.teamRulesSkipped++;
        logWarning(
            `TEAM RULE SKIPPED: ${teamName} | ${ruleLabel} is protected by ${playerDetails(protectedHolder)}.`
        );
        return false;
    }

    // Snapshot the roster so this rule group is atomic if relocation fails.
    const snapshots = roster.map(player => ({ player, number: player.JerseyNum, wasRenumbered: player.wasRenumberedThisRun }));
    const recipientOldNumber = recipient.JerseyNum;
    recipient.JerseyNum = targetNumber;

    let failedHolder = null;
    const relocations = [];
    for (const holder of currentHolders) {
        const replacementRoster = group.replacementRosterFor(holder);
        const replacement = replacementRoster ? findReplacement(holder, replacementRoster, blockedNumbers) : undefined;
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
            `TEAM RULE SKIPPED: ${teamName} | Could not relocate ${playerDetails(failedHolder)} from #${targetNumber}.`
        );
        return false;
    }

    // Lock the recipient so later generic passes cannot undo the tradition.
    recipient.teamRuleLocked = true;
    recipient.teamRuleNumber = targetNumber;
    recipient.wasRenumberedThisRun = recipientOldNumber !== targetNumber;
    stats.teamRulesApplied++;
    stats.teamRuleDisplacements += relocations.length;

    logInfo(`TEAM RULE: ${teamName} | ${ruleLabel} awarded to ${playerDetails(recipient)}.`);
    for (const relocation of relocations) {
        logDisplacement(teamName, relocation.player, relocation.oldNumber, relocation.newNumber, ruleLabel);
    }
    if (recipientOldNumber !== targetNumber) {
        logChange(teamName, recipient, recipientOldNumber, ruleLabel);
    }

    return true;
}

function applyFixedNumberRule(teamName, rule, group, stats) {
    const ruleLabel = group.label ? `${rule.label} - ${group.label}` : rule.label;
    const roster = group.roster;
    const eligiblePlayers = roster.filter(player => matchesRuleEligibility(player, rule));
    if (eligiblePlayers.length === 0) {
        stats.teamRulesSkipped++;
        logWarning(`TEAM RULE SKIPPED: ${teamName} | ${ruleLabel} has no eligible player.`);
        logEligibilityDiagnostics(teamName, ruleLabel, roster, rule);
        return;
    }

    eligiblePlayers.sort((a, b) => compareRecipients(a, b, rule, rule.number));
    const recipient = eligiblePlayers[0];
    reserveNumber(teamName, ruleLabel, group, recipient, rule.number, new Set([rule.number]), stats);
}

function findPoolNumberForRecipient(group, rule, recipient, usedNumbers) {
    const poolNumbers = rule.numberPool;
    const blockedNumbers = new Set(poolNumbers);
    const candidates = [];

    if (poolNumbers.includes(recipient.JerseyNum) && !usedNumbers.has(recipient.JerseyNum)) {
        candidates.push(recipient.JerseyNum);
    }
    for (const number of poolNumbers) {
        if (!usedNumbers.has(number) && !candidates.includes(number)) candidates.push(number);
    }

    return candidates.find(number => canReserveNumber(group, recipient, number, blockedNumbers));
}

function applyNumberPoolRule(teamName, rule, group, stats) {
    const ruleLabel = group.label ? `${rule.label} - ${group.label}` : rule.label;
    const eligiblePlayers = group.roster
        .filter(player => matchesRuleEligibility(player, rule))
        .sort((a, b) => compareRecipients(a, b, rule));

    if (eligiblePlayers.length === 0) {
        stats.teamRulesSkipped++;
        logWarning(`TEAM RULE SKIPPED: ${teamName} | ${ruleLabel} has no eligible player.`);
        logEligibilityDiagnostics(teamName, ruleLabel, group.roster, rule);
        return;
    }

    const usedNumbers = new Set();
    const blockedNumbers = new Set(rule.numberPool);
    const awardCount = Math.min(rule.awardCount ?? rule.numberPool.length, rule.numberPool.length, eligiblePlayers.length);
    const selectedRecipients = eligiblePlayers.slice(0, awardCount);
    let applied = 0;

    // Preserve earned single digits for selected leaders before assigning
    // remaining pool numbers. This keeps traditions stable year to year.
    for (const recipient of selectedRecipients) {
        if (recipient.teamRuleLocked) continue;
        if (!rule.numberPool.includes(recipient.JerseyNum) || usedNumbers.has(recipient.JerseyNum)) continue;
        if (!canReserveNumber(group, recipient, recipient.JerseyNum, blockedNumbers)) continue;

        const numberedLabel = `${ruleLabel} #${recipient.JerseyNum}`;
        if (reserveNumber(teamName, numberedLabel, group, recipient, recipient.JerseyNum, blockedNumbers, stats)) {
            usedNumbers.add(recipient.JerseyNum);
            applied++;
        }
    }

    for (const recipient of eligiblePlayers) {
        if (recipient.teamRuleLocked) continue;
        const targetNumber = findPoolNumberForRecipient(group, rule, recipient, usedNumbers);
        if (targetNumber === undefined) continue;

        const numberedLabel = `${ruleLabel} #${targetNumber}`;
        if (reserveNumber(teamName, numberedLabel, group, recipient, targetNumber, blockedNumbers, stats)) {
            usedNumbers.add(targetNumber);
            applied++;
            if (applied >= awardCount) break;
        }
    }

    if (applied === 0) {
        stats.teamRulesSkipped++;
        logWarning(`TEAM RULE SKIPPED: ${teamName} | ${ruleLabel} had no assignable single-digit numbers.`);
    }
}

function applyReserveOnlyRule(teamName, rule, group, stats) {
    const ruleLabel = group.label ? `${rule.label} - ${group.label}` : rule.label;
    const holders = group.roster.filter(player => player.JerseyNum === rule.number);
    if (holders.length === 0) return;

    const protectedHolder = holders.find(player => player.IsNIL || player.teamRuleLocked);
    if (protectedHolder) {
        stats.teamRulesSkipped++;
        logWarning(
            `TEAM RULE SKIPPED: ${teamName} | ${ruleLabel} is protected by ${playerDetails(protectedHolder)}.`
        );
        return;
    }

    const snapshots = group.roster.map(player => ({ player, number: player.JerseyNum, wasRenumbered: player.wasRenumberedThisRun }));
    const relocations = [];
    let failedHolder = null;

    for (const holder of holders) {
        const replacementRoster = group.replacementRosterFor(holder);
        const replacement = replacementRoster ? findReplacement(holder, replacementRoster, new Set([rule.number])) : undefined;
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
            `TEAM RULE SKIPPED: ${teamName} | Could not relocate ${playerDetails(failedHolder)} from reserved #${rule.number}.`
        );
        return;
    }

    stats.teamRulesApplied++;
    stats.teamRuleDisplacements += relocations.length;
    logInfo(`TEAM RULE: ${teamName} | ${ruleLabel} reserved #${rule.number}.`);
    for (const relocation of relocations) {
        logDisplacement(teamName, relocation.player, relocation.oldNumber, relocation.newNumber, ruleLabel);
    }
}

// Apply every configured tradition before normal duplicate and promotion
// passes. Changes are rolled back if every current holder cannot be relocated.
export function applyTeamSpecificRules(teamGroups, teamNames, stats) {
    for (const [teamIndex, team] of teamGroups) {
        const teamName = teamNames.get(teamIndex) ?? `Team ${teamIndex}`;
        const rules = findRules(teamName);
        if (rules.length === 0) continue;

        reserveRuleNumbersForTeam(team, rules);

        for (const rule of rules) {
            for (const group of getRuleGroups(team, rule)) {
                if (rule.reserveOnly) {
                    applyReserveOnlyRule(teamName, rule, group, stats);
                } else if (rule.numberPool) {
                    applyNumberPoolRule(teamName, rule, group, stats);
                } else {
                    applyFixedNumberRule(teamName, rule, group, stats);
                }
            }
        }
    }
}
