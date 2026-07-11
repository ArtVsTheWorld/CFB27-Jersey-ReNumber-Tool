# CFB 27 Jersey Renumber Tool

Automatically assigns realistic jersey numbers to players in **EA Sports College Football 27 Dynasty Mode** while following modern college football numbering conventions.

The tool analyzes every eligible player on your roster and intelligently assigns legal, position-appropriate jersey numbers while minimizing unnecessary changes.


# How the Tool Works

For every supported player, the tool:

1. Determines whether the player's current jersey number is within an acceptable range for their position.
2. Assigns a preferred jersey number if a change is needed.
3. Falls back to an emergency number if preferred numbers are unavailable.
4. Resolves duplicate jersey numbers automatically.
5. Saves the updated Dynasty file.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Position (Quarterbacks choose above all, Fullbacks choose last)
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

# Backups

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

Thank you to chunky for open sourcing his recruit commitment tool which gave me a good example project to look at since this is the first tool I've made.  And to KivJoy for pointing me in the right directions and for his coaching carousel tool that I also used as an example project

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or College Football 27.


