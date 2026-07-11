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

1. Position (Quarterbacks always choose first, Fullbacks always choose last.)
2. Class Year
3. Previous Redshirt Status
4. Overall Rating

This helps simulate how jersey numbers are typically assigned within a real college football program.

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

If anything goes wrong, simply rename the backup to the original save filename and replace the modified save with the backup copy.

---

# Usage

1. Make sure your Dynasty save is **not open** in-game.
2. Launch the Jersey ReNumber Tool.
3. Select your Dynasty save.
4. Confirm the selected Dynasty.
5. Confirm whether or not you would like to run the tool for user-controlled teams.
6. Wait for processing to complete.
7. Review the changes displayed by the tool.
8. Launch the game.

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

OLs, Kickers, and Punters are intentionally excluded in Version 1.0.

---

## Jersey Assignment Logic

Each position has one or more **preferred jersey ranges**, listed in order of priority.

For example:

```js
preferred: [[0, 19], [80, 89]]
```

The tool will:

1. Try to assign a jersey between **0–19** first.
2. If none are available, try **80–89**.

If no preferred numbers are available, the tool assigns a number from that position's fallback range.

Some positions also include a `promoteChance` value. This gives players wearing a secondary preferred number a chance to "move up" into the primary preferred range each time the tool is run, provided a preferred number is available.

For example:

```js
WR: {
    preferred: [[0, 19], [80, 89]],
    fallback: [[36, 44]],
    promoteChance: 0.75
}
```

A WR wearing an 80-series number has a **75% chance** each time the tool is run to attempt to move into an available 0–19 jersey. If no primary number is available—or the promotion check fails—the player keeps their current jersey number.

---

# Known Limitations

- Offensive linemen are not currently processed.
- Specialists (K/P) are not currently processed, as such you may run into situations where there are 3 of one number on a team. (One on offense, one on defense, one K/P)
- Team-specific numbering traditions are not currently considered.
- Retired or honored jersey numbers are not currently tracked.

---

# Changelog

## Version 1.0

- Initial public release.

---

# Credits

Special thanks to **chunky** for open-sourcing his Recruit Commitment Tool, which served as a great learning resource while I built my first modding tool.

Thanks also to **KivJoy** for answering countless questions throughout development and for sharing his Coaching Carousel Tool, which was another valuable reference.

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or EA Sports College Football 27.
