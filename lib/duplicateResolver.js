// ==========================================
// Duplicate Resolver
//
// Determines which players must give up
// duplicate jersey numbers.
//
// IMPORTANT:
//
// Rosters MUST already be sorted before
// calling this function.
//
// The first player with a jersey number
// keeps it.
//
// Later players with the same number are
// flagged for renumbering.
// ==========================================

// ==========================================
// Resolve duplicate jersey numbers.
//
// Parameters:
//
// roster
//     Offensive or defensive roster.
//
// ==========================================

function resolveDuplicates(roster) {

    // Tracks jersey numbers that have
    // already been claimed.
    const claimedNumbers = new Set();

    for (const player of roster) {

        // Assume every player gets to keep
        // his current jersey.
        player.mustRenumberDuplicate = false;

        // Has someone already claimed this
        // jersey number?
        if (claimedNumbers.has(player.JerseyNum)) {

            // This player loses the conflict.
            player.mustRenumberDuplicate = true;

            continue;

        }

        // First player to claim this number
        // keeps it.
        claimedNumbers.add(player.JerseyNum);

    }

}

// ==========================================
// Returns true if a jersey number is
// available on this side of the ball.
//
// Players already flagged to receive a new
// jersey are ignored because they will not
// keep their current number.
// ==========================================

function isNumberAvailable(currentPlayer, targetNumber, roster) {
    for (const otherPlayer of roster) {
        if (otherPlayer === currentPlayer)
            continue;

        if (otherPlayer.JerseyNum === targetNumber) {
            // console.log(
            //     `BLOCKED ${currentPlayer.FirstName} ${currentPlayer.LastName} ` +
            //     `wanted #${targetNumber} because ${otherPlayer.FirstName} ${otherPlayer.LastName} already has it.`
            // );

            return false;
        }
    }

    return true;
}

module.exports = {
    resolveDuplicates,
    isNumberAvailable
};