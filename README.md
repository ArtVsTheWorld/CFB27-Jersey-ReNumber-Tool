# CFB 27 Jersey ReNumber Tool

Automatically assigns realistic jersey numbers to players in College Football 27 Dynasty Mode while following modern college football numbering conventions.

The tool analyzes every eligible player on your roster and intelligently assigns jersey numbers that better reflect what you see on Saturdays.

<img width="1080" height="1080" alt="demogif" src="https://github.com/user-attachments/assets/c8d7f6f6-e7d8-4104-bbe3-3fe4e4cf77cb" />

---

# How the Tool Works

For every supported player, the tool:

1. Determines whether the player's current jersey number falls within an acceptable range for their position.
2. Assigns a preferred jersey number if a change is needed. Some positions also have a chance to move from a secondary preferred range into a more desirable primary range when one becomes available (for example, a CB wearing #14 may attempt to move to an available single-digit number).
3. When possible, prefers similar-looking jersey numbers (for example, a WR wearing #84 will first try #4, then #8, then #14 or #18 before selecting another preferred number).
4. Falls back to an emergency number if no preferred numbers are available.
5. Automatically resolves duplicate jersey numbers on the same side of the ball, while preserving base-game QB-QB shared numbers.
6. Avoids assigning configured unavailable, legacy-permission, and temporarily withheld school numbers.
7. Applies supported team traditions, beginning with LSU awarding #7 to its highest-rated eligible player.
8. Either previews the proposed changes or backs up and saves the updated Dynasty file.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Class Year
2. Redshirt Status
3. Overall Rating

The only exceptions are QBs (always pick their numbers ahead of other positions regardless of age or OVR) and FBs (always pick last regardless of age or OVR). This produces realistic roster-wide numbering without manual intervention. This helps simulate how jersey numbers are typically assigned within a real college football program.

---

# When Should I Run the Tool?

Please run this tool in preseason week for the best results!

---

# Backups

Before making any changes, the tool automatically creates a backup of your Dynasty save.

If anything goes wrong, simply reload the backup file. I recommend creating manual backups as well for an extra safety net.

---

# Usage

1. Ensure your Dynasty save is **not open** in EA Sports College Football 27.
2. Download and extract the latest release.
3. Double-click **CFB27_JerseyRenumberTool.bat**.
4. Select your Dynasty save when prompted.
5. Choose Preview Only or Apply Changes.
6. Verify the selected Dynasty is correct.
7. Choose whether to include user-controlled teams in the renumbering process.
8. Choose whether to enable team-specific jersey rules.
9. Wait for the tool to finish processing your roster.
10. Review the color-coded summary and jersey changes displayed in the console.
11. If applying changes, load your updated Dynasty.

---

# Notes

- This tool only modifies jersey numbers.
- NIL players are automatically skipped and retain their assigned jersey numbers to preserve real-world player likenesses.
- No player ratings, attributes, tendencies, equipment, recruiting data, or other Dynasty information are changed.
- Existing backups are never overwritten.
- Running the tool multiple times is safe.
- Preview Only performs the full simulation without creating a backup or saving the Dynasty file.

---

# Frequently Asked Questions

## Will this change every player's jersey?

No.

Players who already have appropriate jersey numbers will usually keep them. Only players with illegal, duplicate, or otherwise undesirable jersey numbers are changed.

---

## Can I run it more than once?

Yes.

The tool only changes players whose jersey numbers need to be updated. Running it multiple times is completely safe.

---

## Why wasn't my offensive lineman renumbered?

The current version only evaluates the following positions:

- Offense: QB, HB, WR, TE, FB
- Defense: DE, DT, MIKE, OLB, CB, S

OL, Kickers, and Punters are intentionally excluded.

---

## Jersey Assignment Logic

Each position has one or more **preferred jersey groups**, listed in order of priority. Within each group, numbers are also prioritized.

For example:

```js
WR: {
    preferred: [
        [1,2,3,4,5,6,7,8,0,9,11,10,12,13,14,15,16,17,18,19],
        [88,80,81,82,83,84,85,86,87,89]
    ],
    fallback: [
        [20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39]
    ],
    promoteChance: 0.65
}
```

The tool attempts to assign jerseys in the following order:

1. Preferred Group 1 (in the order listed)
2. Preferred Group 2 (in the order listed)
3. Fallback Group

Because each group is ordered, some jersey numbers are intentionally favored over others to better reflect modern college football numbering trends.

### Promotions

Some positions include a `promoteChance` value.

If a player is already wearing a jersey from a lower-priority preferred group (for example, an 80-series WR), they have a chance each time the tool is run to move into an available jersey from a higher-priority preferred group.

For example:

```js
promoteChance: 0.65
```

A wide receiver wearing an 80-series number has a **65% chance** each time the tool is run to attempt to move into an available single-digit or teen number. If no higher-priority jersey is available—or the promotion check fails—the player keeps their current number.

Promotions never occur into fallback numbers and never create duplicate jerseys.

---

# Retired and Protected Numbers

The tool tracks school-specific protected numbers with statuses instead of a simple retired flag:

- **Unavailable** numbers are blocked from ordinary assignment.
- **Legacy/permission required** numbers are blocked from ordinary assignment.
- **Temporarily withheld** numbers are blocked from ordinary assignment.
- **Annual honor**, **honored but reusable**, and **position tradition** numbers are documented but not hard-blocked by the retired-number layer.

Examples:

- LSU #20 is blocked for Billy Cannon.
- LSU #21 and #37 are honored but remain reusable.
- Ole Miss #38, Texas A&M #12, and Virginia Tech #25 are treated as annual-honor numbers rather than retired-number blocks.
- Clemson #4 and #28, plus Syracuse #44, are treated as legacy/permission-required numbers.

The protected-number list is intentionally high-confidence rather than a blind copy of every school retired-jersey page.

---

# Known Limitations

- Offensive linemen (LT, LG, C, RG, RT) are intentionally excluded. I feel the game does an ok job here.
- Specialists (K/P) are intentionally excluded. As a result, a team may legitimately have three players wearing the same number (offense, defense, and specialist).
- QBs on the same team will sometime share numbers. This appears to be base game logic to prevent QBs from taking 20s or higher numbers.
- Protected-number handling is a curated working list, not an exhaustive database.
- Jersey assignments are based solely on roster composition and position; depth chart order is not considered.

---

# Changelog

## Version 2.0

- Added Preview Only and Apply Changes run modes.
- Added optional team-specific jersey rules, starting with LSU's #7 tradition. (Awarded to the single highest overall player of an eligible position on the team. Will move other players wearing #7 to different numbers.)
- Added color-coded change, duplicate, displacement, and status logging.
- Added player class year to change logging.
- Reworked the final summary around clearer roster and change metrics.
- Preserved base-game QB-QB shared jersey numbers.
- Increased promotion chances for most positions.
- Added statused retired and protected number handling.

---

# Planned Additions

- Configurable protected-number lists and status overrides.
- Configurable number ranges/promotion chances.
- More team specific jersey rules.

---

# Credits

Special thanks to **chunky** for open-sourcing his Recruit Commitment Tool, which served as a great learning resource while I built my first modding tool.

Thanks also to **KivJoy** for answering countless questions throughout development and for sharing his Coaching Carousel Tool, which was another valuable reference.

And last but not least thanks to ChatGPT Codex and VS Code agent for being my best buds! :)

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or EA Sports College Football 27.
