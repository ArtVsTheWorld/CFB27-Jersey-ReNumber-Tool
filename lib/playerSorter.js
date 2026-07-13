// Player Sorter: determines ordering so higher-priority players
// select jerseys first. Priority factors: school year, position
// boosts, redshirt status, then OverallRating.

const YEAR_PRIORITY = { Senior: 6, Junior: 4, Sophomore: 2, Freshman: 0 };
const POSITION_PRIORITY = { QB: 100, FB: -100 };

function getPriority(player) { let priority = YEAR_PRIORITY[player.SchoolYear] ?? 0; priority += POSITION_PRIORITY[player.Position] ?? 0; if (player.RedshirtStatus === "Previous") priority += 1; return priority; }

export function sortRoster(roster) { roster.sort((a, b) => { const pd = getPriority(b) - getPriority(a); if (pd !== 0) return pd; return b.OverallRating - a.OverallRating; }); }