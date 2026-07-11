# CFB 27 Jersey Renumber Tool

Automatically assigns realistic jersey numbers to players in **EA Sports College Football 27 Dynasty Mode** while following modern college football numbering conventions.

The tool analyzes every eligible player on your roster and intelligently assigns jersey numbers in a way that feels true to what you see on Saturdays.


# How the Tool Works

For every supported player, the tool:

1. Determines whether the player's current jersey number is within an acceptable range for their position.
2. Assigns a preferred jersey number if a change is needed. Some positions also have a chance to move from a secondary preferred range into a more desirable primary range when one becomes available (for example, a CB wearing #14 may attempt to move to an available single-digit number).
3. When possible, prefers similar-looking jersey numbers (for example, a WR wearing #84 will first try #4, then #8, then #14 or $18 before selecting another preferred number).
4. Falls back to an emergency number if preferred numbers are unavailable.
5. Resolves duplicate jersey numbers on the same side of the ball automatically.
6. Saves the updated Dynasty file.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Position (Quarterbacks always choose first, Fullbacks always choose last)
2. School Year
3. Previous Redshirt Status
4. Overall Rating

This helps simulate how jersey numbers are typically assigned within a real college football program.

---

# When Should I Run the Tool?

The tool can be run at two different points during the offseason.

## Option 1 — National Signing Day

Only players currently on your roster are renumbered. This gives returning players priority over incoming players. Incoming recruits and transfers added after National Signing Day will receive jersey numbers using the game's default assignment logic unless you run the tool again.

## Option 2 — Preseason Week

The entire roster is renumbered including returning players, transfers, and incoming freshmen. Waiting to run until this week would give incoming transfers/freshman priority, as the game's default number assignment logic will have already filled them into available preferred numbers.

---

# Backups Guide

Before making any changes, the tool automatically creates a backup of your Dynasty save.

If anything goes wrong, simply restore the backup manually by RENAMING IT TO THE ORIGINAL NAME and replacing the modified save with the backup copy.

---

# Usage

1. Make sure your dynasty save is not open in-game.
2. Launch the Jersey Renumber Tool.
3. Select your Dynasty save.
4. Confirm the selected Dynasty.
5. Wait for processing to complete.
6. Feel free to scroll through and review changes within the tool.
7. Launch the game.

---

# Notes

- This tool only modifies jersey numbers.
- No player ratings, attributes, tendencies, equipment, or recruiting data are changed.
- Existing backups are never overwritten.
- Running the tool multiple times is safe.

---

# Frequently Asked Questions

## Will this change every player's jersey?

No.

Players who already have appropriate jersey numbers will usually keep them. Only players with illegal, duplicate, or conflicting numbers are changed.

## Can I run it more than once?

Yes.

The tool only changes players whose jersey numbers need to be updated.

---

## Why wasn't my offensive lineman renumbered?

The current version only evaluates:

- QB
- HB
- FB
- WR
- TE
- DE
- DT
- LOLB
- MLB
- ROLB
- CB
- FS
- SS

OL/K/P are intentionally ignored at this moment.

---

## Jersey Assignment Logic

Each position has one or more **preferred jersey ranges**, listed in order of priority.

For example:

```js
preferred: [[0, 19], [80, 89]]
```

means the tool will:

1. Try to assign a jersey between **0–19** first.
2. If none are available, try **80–89**.

If no preferred numbers are available, the tool assigns a number from that position's **fallback** range.

Some positions also include a **promoteChance** value. This gives players who are wearing a secondary preferred number a chance to "move up" into the primary preferred range each time the tool is run, if a number becomes available.

For example:

```js
WR: {
        preferred: [[0, 19], [80, 89]],
        fallback: [[36, 44]],
        promoteChance: 0.75
    },
```

A WR wearing an 80-series number has a **75% chance** each time the tool is run to attempt to move into an available 0–19 jersey. If no primary number is available—or the promotion check fails—they keep their current number.

# Known Limitations at this moment

- Offensive linemen are not currently processed by the renumber tool.
- Specialists (K, P) are not currently processed by the renumber tool.
- Team-specific numbering traditions are not considered.
- Jersey retirement and honored numbers are not tracked.

---

# Changelog

## Version 1.0

- Initial public release

---

# Credit

Special thanks to **chunky** for open-sourcing his Recruit Commitment Tool, which gave me a great example project to learn from while building my first tool.

Thanks also to **KivJoy** for pointing me in the right direction throughout development and for showing me his Coaching Carousel Tool, which I also used as a reference.

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or College Football 27.


