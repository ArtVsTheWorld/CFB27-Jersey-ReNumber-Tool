// Validator: inspect finished rosters for duplicates and remaining
// suboptimal jerseys. This is read-only and intended for reporting.
import { getRenumberReason } from "./numberRules.js";
import { isAllowedExistingDuplicate } from "./duplicateResolver.js";

export function validateRoster(teamName, sideName, roster) {
    let duplicates = 0, suboptimal = 0;
    const grouped = new Map(); for (const player of roster) { if (!grouped.has(player.JerseyNum)) grouped.set(player.JerseyNum, []); grouped.get(player.JerseyNum).push(player); }
    for (const [number, players] of grouped) {
        if (players.length <= 1) continue;
        const allowedQBShare = players.every(player => isAllowedExistingDuplicate(players[0], player));
        if (allowedQBShare) continue;

        const conflictingPlayers = players.filter(player => player.mustRenumberDuplicate);
        duplicates += conflictingPlayers.length || players.length - 1;
        console.log(`\n${teamName} | ${sideName} | Duplicate #${number}`);
        for (const p of players) console.log(`   ${p.FirstName} ${p.LastName} (${p.Position}) (${p.SchoolYear}) | mustRenumber=${p.mustRenumberDuplicate}`);
    }
    for (const player of roster) if (getRenumberReason(player).suboptimal) suboptimal++;
    return { duplicates, suboptimal };
}
