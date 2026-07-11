# CFB 27 Jersey ReNumber Tool

Automatically assigns realistic jersey numbers to players in **EA SPORTS College Football 27 Dynasty Mode** while following modern college football numbering conventions.

The tool intelligently renumbers eligible players using position-specific rules, resolves duplicate jersey conflicts, preserves realistic number distribution, and automatically creates a backup of your Dynasty before making any changes.

<img width="1080" height="1080" alt="demogif" src="https://github.com/user-attachments/assets/c8d7f6f6-e7d8-4104-bbe3-3fe4e4cf77cb" />

---

# Features

- Automatically renumbers eligible offensive and defensive players.
- Resolves duplicate jersey numbers on the same side of the ball.
- Uses realistic position-specific jersey ranges.
- Supports jersey promotions into premium number ranges.
- Preserves NIL player jersey numbers.
- Automatically creates timestamped backups.
- Processes every team in the Dynasty or optionally skips user-controlled teams.
- Displays a complete processing summary after completion.

---

# Supported Positions

### Offense

- QB
- HB
- FB
- WR
- TE

### Defense

- LE
- RE
- DT
- LOLB
- MLB
- ROLB
- CB
- FS
- SS

Offensive linemen and specialists (K/P) are intentionally excluded.

---

# Jersey Assignment Logic

Each position has:

- Preferred jersey ranges
- Fallback ranges
- Optional promotion chances

Example:

```js
WR: {
    preferred: [[0, 19], [80, 89]],
    fallback: [[20, 39]],
    promoteChance: 0.65
}
```

Players already wearing a preferred jersey usually keep their number.

Players wearing a secondary preferred range may occasionally be promoted into a more desirable range if an appropriate number becomes available.

If no preferred number is available, the tool searches fallback ranges before using an emergency assignment.

The assignment algorithm also attempts to preserve visually similar numbers whenever possible.

Examples:

- #84 → #4
- #84 → #8
- #84 → #14
- #84 → #18

before selecting other preferred numbers.

---

# Player Priority

When multiple players compete for the same jersey number, priority is determined by:

1. Position
2. Class Year
3. Previous Redshirt Status
4. Overall Rating

This produces realistic roster-wide numbering without manual intervention.

---

# Duplicate Resolution

Duplicate jerseys are only prevented among players on the same side of the football.

Examples:

✅ QB #7 and CB #7

✅ WR #1 and FS #1

Not allowed:

❌ QB #12 and WR #12

❌ MLB #5 and CB #5

This mirrors modern NCAA numbering rules.

---

# Backup System

Before making any changes, the tool automatically creates a timestamped backup of your Dynasty save.

Existing backups are never overwritten.

If necessary, simply restore the backup by renaming the file to what it was orignally called.
---

# Usage

1. Make sure your dynasty save **is not** open in the game.
2. Launch **CFB27_JerseyReNumberTool.exe**.
3. Select a Dynasty save that is on National Signing Day (Position Changes) week, or Preseason.
4. Confirm the selected Dynasty.
5. Choose whether to process user-controlled teams.
6. Wait for processing to complete.
7. Review the summary.
8. Done!

---

# Notes

- Only jersey numbers are modified.
- NIL players are automatically skipped.
- Ratings, equipment, recruiting data, abilities, contracts, schedules, and Dynasty information are untouched.

---

# Frequently Asked Questions

## Will every player receive a new jersey?

No.

Players already wearing an appropriate jersey number will generally keep their existing number unless they are selected for a promotion or involved in a duplicate-number conflict. NIL players are also untouched by this tool.

---

## When should I run this tool?

## Option 1 — National Signing Day (Position Changes)

Only players currently on your roster are renumbered, incoming players are not. Running the tool in this week will result in more preferrable numbers for returning players, but less number continuity. Incoming recruits and transfers added after National Signing Day will fill in to unused jersey numbers using the game's default assignment logic when you sim.

## Option 2 — Preseason

The entire roster is renumbered at the same time, including returning players and any new players. Waiting until this week to run the tool will result in less preferrable numbers for returning players, but more number continuity. 

These options are entirely personal preference.

---

## Why weren't offensive linemen renumbered?

Version 1.0 intentionally focuses on skill positions and front-seven defenders.

Future versions may expand support.

---

# Known Limitations

- Offensive linemen are not currently processed.
- Kickers and punters are not currently processed.
- Team-specific numbering traditions are not considered.
- Retired jersey numbers are not reserved.

---

# Version 1.0

Initial public release.

Features include:

- Intelligent jersey assignment
- Duplicate resolution
- Promotion system
- Automatic backups
- User-team selection
- Processing summaries
- Safe repeated execution

---

# Credits

Special thanks to **chunky** for open-sourcing the Recruit Commitment Tool, which served as an excellent learning resource.

Thanks also to **KivJoy** for answering countless questions throughout development and for sharing the Coaching Carousel Tool.

---

# Disclaimer

This project is an unofficial community tool and is not affiliated with or endorsed by Electronic Arts, EA SPORTS, or College Football 27.

