# CFB 27 Jersey Renumber Tool

Automatically assigns realistic jersey numbers to players in **EA Sports College Football 27 Dynasty Mode** while following modern college football numbering conventions.

The tool analyzes every eligible player on your roster and intelligently assigns legal, position-appropriate jersey numbers while minimizing unnecessary changes.

---

# Features

- Realistic jersey numbering by position
- Prioritizes upperclassmen over younger players
- Quarterbacks receive first choice of premium QB numbers
- Fullbacks receive lowest priority to minimize conflicts
- Preserves existing legal jersey numbers whenever possible
- Automatically resolves duplicate jersey numbers
- Creates a backup before making any changes
- Works directly with Dynasty save files

---

# Supported Positions

The following positions are evaluated by the tool:

- QB
- HB
- FB
- WR
- TE
- DE
- LOLB
- MLB
- ROLB
- CB
- FS
- SS

Players at other positions are left unchanged.

---

# How the Tool Works

For every supported player, the tool:

1. Determines whether the player's current jersey number is legal for their position.
2. Keeps legal numbers whenever possible.
3. Assigns a preferred jersey number if a change is needed.
4. Falls back to secondary ranges if preferred numbers are unavailable.
5. Resolves duplicate jersey numbers automatically.
6. Saves the updated Dynasty file.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Quarterbacks
2. School Year
3. Previous Redshirt Status
4. Overall Rating

This helps simulate how jersey numbers are typically assigned within a real college football program.

---

# When Should I Run the Tool?

The tool can be run at two different points during the offseason.

## Option 1 — National Signing Day (Recommended)

Only players currently on your roster are renumbered.

Incoming recruits and transfers added after National Signing Day will receive jersey numbers using the game's default assignment logic.

**Advantages**

- Fewer jersey changes
- Better continuity between seasons
- Faster processing

---

## Option 2 — Preseason Week

The entire roster is renumbered, including:

- Returning players
- Incoming freshmen
- New transfers

This produces the most consistent roster because every player is evaluated using the same numbering rules.

---

# Backups

Before making any changes, the tool automatically creates a backup of your Dynasty save.

If anything goes wrong, simply restore the backup manually by replacing the modified save with the backup copy.

---

# Usage

1. Close College Football 27.
2. Launch the Jersey Renumber Tool.
3. Select your Dynasty save.
4. Confirm the selected Dynasty.
5. Wait for processing to complete.
6. Launch the game.

---

# Requirements

- EA Sports College Football 27
- Windows
- Dynasty save files

---

# Notes

- This tool only modifies jersey numbers.
- No player ratings, attributes, tendencies, equipment, or recruiting data are changed.
- Existing backups are never overwritten.
- Running the tool multiple times is safe.

---

# Frequently Asked Questions

## Will this corrupt my Dynasty?

No.

The tool creates a backup before making any modifications.

---

## Can I run it more than once?

Yes.

The tool only changes players whose jersey numbers need to be updated.

---

## Why didn't every player receive a new number?

This is intentional.

Players already wearing legal, position-appropriate numbers will generally keep them.

---

## Why wasn't my offensive lineman renumbered?

The current version only evaluates:

- QB
- HB
- FB
- WR
- TE
- DE
- LOLB
- MLB
- ROLB
- CB
- FS
- SS

Other positions are intentionally ignored.

---

## Will recruits receive new jersey numbers?

It depends on when you run the tool.

**National Signing Day**

Only current roster players are renumbered.

**Preseason**

Everyone on the roster is renumbered, including incoming freshmen and transfers.

---

# Known Limitations

- Offensive linemen are not currently renumbered.
- Specialists (K, P, LS) are not currently renumbered.
- Team-specific numbering traditions are not considered.
- Jersey retirement and honored numbers are not tracked.

---

# Changelog

## Version 1.0

- Initial public release
- Automatic backups
- Position-based jersey assignment
- Duplicate resolution
- Veteran priority system
- Quarterback priority
- Fullback support
- Modern NCAA jersey numbering rules

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts (EA), EA Sports, or College Football 27.
