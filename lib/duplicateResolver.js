// Duplicate Resolver: mark later players with conflicting jerseys
// (mustRenumberDuplicate = true) and provide a small helper to
// check whether a number is free on a roster side.

export function resolveDuplicates(roster) {
    for (const player of roster) player.mustRenumberDuplicate = false;

    const claimedNumbers = new Map();

    for (const player of roster) {
        const currentOwner = claimedNumbers.get(player.JerseyNum);

        if (!currentOwner) {
            claimedNumbers.set(player.JerseyNum, player);
            continue;
        }

        if (currentOwner.IsNIL && !player.IsNIL) {
            player.mustRenumberDuplicate = true;
            continue;
        }

        if (!currentOwner.IsNIL && player.IsNIL) {
            currentOwner.mustRenumberDuplicate = true;
            claimedNumbers.set(player.JerseyNum, player);
            continue;
        }

        player.mustRenumberDuplicate = true;
    }
}

export function isNumberAvailable(currentPlayer, targetNumber, roster) {
    for (const otherPlayer of roster) {
        if (otherPlayer === currentPlayer) continue;
        if (otherPlayer.JerseyNum === targetNumber) return false;
    }
    return true;
}