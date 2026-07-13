// Duplicate Resolver: mark later players with conflicting jerseys
// (`mustRenumberDuplicate = true`) and provide a small helper to
// check whether a number is free on a roster side.

export function resolveDuplicates(roster) {
    const claimedNumbers = new Set();
    for (const player of roster) {
        player.mustRenumberDuplicate = false; // default
        if (claimedNumbers.has(player.JerseyNum)) { player.mustRenumberDuplicate = true; continue; }
        claimedNumbers.add(player.JerseyNum);
    }
}

export function isNumberAvailable(currentPlayer, targetNumber, roster) {
    for (const otherPlayer of roster) {
        if (otherPlayer === currentPlayer) continue;
        if (otherPlayer.JerseyNum === targetNumber) return false;
    }
    return true;
}