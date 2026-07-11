// ==========================================
// Player Filter
//
// Determines whether a player should be
// included in jersey renumbering.
// ==========================================

const VALID_POSITIONS = new Set([
    "QB",
    "HB",
    "FB",
    "WR",
    "TE",
    "DE",
    "DT",
    "LOLB",
    "MLB",
    "ROLB",
    "CB",
    "FS",
    "SS"
]);

function isPlaceholderPlayer(player) {
    return (
        player.FirstName === "Omar" &&
        player.LastName === "Omar" &&
        player.Position === "QB" &&
        player.JerseyNum === 0
    );
}

function shouldProcess(player) {
    if (player.IsNIL) return false;
    if (player.TeamIndex < 0) return false;
    if (player.TeamIndex === 255) return false;
    if (isPlaceholderPlayer(player)) return false;
    if (!VALID_POSITIONS.has(player.Position)) return false;
    return true;
}

module.exports = {
    shouldProcess
};