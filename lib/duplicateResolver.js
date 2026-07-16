// Duplicate Resolver: mark later players with conflicting jerseys
// (mustRenumberDuplicate = true) and provide a small helper to
// check whether a number is free on a roster side.

// The base game permits multiple quarterbacks on the same roster to retain
// the same jersey number. Treat that existing QB-QB pairing as non-conflicting
// so a backup QB is not renumbered at the expense of another player.
export function isAllowedExistingDuplicate(firstPlayer, secondPlayer) {
    return firstPlayer.Position === "QB" && secondPlayer.Position === "QB";
}

export function resolveDuplicates(roster) {
    for (const player of roster) player.mustRenumberDuplicate = false;

    const playersByNumber = new Map();
    for (const player of roster) {
        if (!playersByNumber.has(player.JerseyNum)) playersByNumber.set(player.JerseyNum, []);
        playersByNumber.get(player.JerseyNum).push(player);
    }

    for (const players of playersByNumber.values()) {
        if (players.length <= 1) continue;
        if (players.every(player => player.Position === "QB")) continue;

        const nilPlayers = players.filter(player => player.IsNIL);
        if (nilPlayers.length > 0) {
            for (const player of players) {
                if (player.IsNIL) continue;
                if (nilPlayers.some(nilPlayer => !isAllowedExistingDuplicate(nilPlayer, player))) {
                    player.mustRenumberDuplicate = true;
                }
            }
            continue;
        }

        const quarterbacks = players.filter(player => player.Position === "QB");
        if (quarterbacks.length > 0) {
            for (const player of players) {
                if (player.Position !== "QB") player.mustRenumberDuplicate = true;
            }
            continue;
        }

        for (const player of players.slice(1)) player.mustRenumberDuplicate = true;
    }
}

export function isNumberAvailable(currentPlayer, targetNumber, roster) {
    for (const otherPlayer of roster) {
        if (otherPlayer === currentPlayer) continue;
        if (otherPlayer.JerseyNum === targetNumber) return false;
    }
    return true;
}
