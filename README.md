# CFB 27 Jersey ReNumber Tool

Automatically assigns realistic jersey numbers to players in **EA Sports College Football 27 Dynasty Mode** while following modern college football numbering conventions.

The tool analyzes every eligible player on your roster and intelligently assigns jersey numbers that better reflect what you see on Saturdays.

<img width="1080" height="1080" alt="demogif" src="https://github.com/user-attachments/assets/c8d7f6f6-e7d8-4104-bbe3-3fe4e4cf77cb" />

---

# How the Tool Works

For every supported player, the tool:

1. Determines whether the player's current jersey number falls within an acceptable range for their position.
2. Assigns a preferred jersey number if a change is needed. Some positions also have a chance to move from a secondary preferred range into a more desirable primary range when one becomes available (for example, a CB wearing #14 may attempt to move to an available single-digit number).
3. When possible, prefers similar-looking jersey numbers (for example, a WR wearing #84 will first try #4, then #8, then #14 or #18 before selecting another preferred number).
4. Falls back to an emergency number if no preferred numbers are available.
5. Automatically resolves duplicate jersey numbers on the same side of the ball.
6. Saves the updated Dynasty file.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Class Year
2. Redshirt Status
3. Overall Rating

The only exceptions are QBs (always pick their numbers ahead of other positions regardless of age or OVR) and FBs (always pick last regardless of age or OVR). This produces realistic roster-wide numbering without manual intervention. This helps simulate how jersey numbers are typically assigned within a real college football program.

---

# When Should I Run the Tool?

The tool can be run at two different points during the offseason.

## Option 1 — National Signing Day

Only players currently on your roster are renumbered, incoming players are not. Running the tool in this week will result in more preferrable numbers for returning players, but less number continuity. Incoming recruits and transfers added after National Signing Day will fill in to unused jersey numbers using the game's default assignment logic unless you run the tool again in preseason week.

## Option 2 — Preseason Week

The entire roster is renumbered at the same time, including returning players and incoming players. Waiting until this week to run the tool will result in more preferrable numbers for incoming players, and more number continuity. 

These options are entirely personal preference.

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
5. Verify the selected Dynasty is correct.
6. Choose whether to include user-controlled teams in the renumbering process.
7. Wait for the tool to finish processing your roster.
8. Review the summary and jersey changes displayed in the console.
9. Press **Enter** to close the tool.
10. Load your updated Dynasty.

---

# Notes

- This tool only modifies jersey numbers.
- NIL players are automatically skipped and retain their assigned jersey numbers to preserve real-world player likenesses.
- No player ratings, attributes, tendencies, equipment, recruiting data, or other Dynasty information are changed.
- Existing backups are never overwritten.
- Running the tool multiple times is safe.

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

# Known Limitations

- Offensive linemen (LT, LG, C, RG, RT) are intentionally excluded. I feel the game does an ok job here.
- Specialists (K/P) are intentionally excluded. As a result, a team may legitimately have three players wearing the same number (offense, defense, and specialist).
- Team-specific numbering traditions are not currently considered.
- Retired or honored jersey numbers are not tracked.
- Jersey assignments are based solely on roster composition and position; depth chart order is not considered.

---

# Changelog

## Version 1.6

- Fixed a bug that was causing NIL players to not be accounted for when switching to a preferred number. If an NIL player and a generated players have the same number, the generated player will be moved.
- Updated logic to only displace other players from duplicate numbers, not on promotions or corrections.
- Fixed logging to correctly show displaced players, and to show player OVR.
- Updated naming convention on backups AGAIN. Sometimes if the filename is too long, they won't load. If that happens, manually rename the backup to something shorter and then it will work.
- Cleaned up code.

---

# Planned Additions

- Team specific jersey rules.
- Retired number support.
- Configurable number ranges/promotion chances.
- Positional Archetype based rules/number preferences.

---

# Credits

Special thanks to **chunky** for open-sourcing his Recruit Commitment Tool, which served as a great learning resource while I built my first modding tool.

Thanks also to **KivJoy** for answering countless questions throughout development and for sharing his Coaching Carousel Tool, which was another valuable reference.

And last but not least thanks to ChatGPT and VS Code agent for being my best buds! :)

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or EA Sports College Football 27.
