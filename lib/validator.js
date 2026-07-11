// ==========================================
// Jersey Validator
//
// Checks finished rosters for:
//
// • Duplicate jersey numbers
// • Suboptimal jersey numbers
//
// This runs AFTER all renumbering has
// completed.
//
// It never changes player data.
// ==========================================

const { getRenumberReason } = require("./numberRules");

// ==========================================
// Validate one side of the ball.
//
// Parameters:
//
// teamName
// sideName
// roster
//
// Returns:
//
// {
//     duplicates,
//     suboptimal
// }
//
// ==========================================

function validateRoster(teamName, sideName, roster) {

    let duplicates = 0;
    let suboptimal = 0;

    // ==========================================
    // Find duplicate jerseys.
    // ==========================================

    const grouped = new Map();

    for (const player of roster) {

        if (!grouped.has(player.JerseyNum)) {
            grouped.set(player.JerseyNum, []);
        }

        grouped.get(player.JerseyNum).push(player);

    }

    for (const [number, players] of grouped) {

        if (players.length > 1) {

            duplicates += players.length - 1;

            console.log(`\n${teamName} | ${sideName} | Duplicate #${number}`);

            for (const p of players) {

                console.log(
                    `   ${p.FirstName} ${p.LastName} (${p.Position}) (${p.SchoolYear}) | mustRenumber=${p.mustRenumberDuplicate}`
                );

            }

        }

    }

    // ==========================================
    // Count players still outside their preferred
    // jersey range.
    // ==========================================

    for (const player of roster) {

        const reason = getRenumberReason(player);

        if (reason.suboptimal) {
            suboptimal++;
        }

    }

    return {
        duplicates,
        suboptimal
    };

}

module.exports = {
    validateRoster
};