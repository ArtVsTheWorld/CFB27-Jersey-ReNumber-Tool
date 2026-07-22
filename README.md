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
6. Applies supported team traditions using rule-specific scoring for playmakers, leaders, special-teamers, home-state legacy players, and reserved numbers.
7. Either previews the proposed changes or backs up and saves the updated Dynasty file.

---

# Player Priority

For generic roster-wide number assignment, when multiple players compete for the same jersey number, priority is determined by:

1. Class Year
2. Redshirt Status
3. Overall Rating

The only exceptions are QBs (always pick their numbers ahead of other positions regardless of age or OVR) and FBs (always pick last regardless of age or OVR). This produces realistic roster-wide numbering without manual intervention. This helps simulate how jersey numbers are typically assigned within a real college football program.

Team-specific traditions use their own scoring logic before the generic assignment passes run.

---

# When Should I Run the Tool?

The tool can be run at two different points during the offseason.

## Option 1 — National Signing Day

Only players currently on your roster are renumbered, incoming players are not. Running the tool in this week will result in more preferrable numbers for returning players, but less number continuity. Incoming recruits and transfers added after National Signing Day will fill in to unused jersey numbers using the game's default assignment logic unless you run the tool again in preseason week.

## Option 2 — Preseason Week

The entire roster is renumbered at the same time, including returning players and incoming players. Waiting until this week to run the tool will result in more preferrable numbers for incoming players, and more number continuity. This option is also better for applying team traditions properly.

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

Generic position renumbering only evaluates the following positions:

- Offense: QB, HB, WR, TE, FB
- Defense: DE, DT, MIKE, OLB, CB, S

OL, Kickers, Punters, and Long Snappers are intentionally excluded from generic renumbering, but they may still be considered for configured team traditions.

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

# Team Traditions

When enabled, team-specific traditions run before the generic jersey passes. Awarded players are locked so later passes cannot undo the tradition, and configured tradition numbers are reserved so generic promotions or fallback assignments cannot give those numbers to non-winners.

The tradition engine uses different scoring profiles depending on the number:

- Playmaker traditions weigh overall rating, impact-player status, development trait, awards, game rating, and position production.
- Leadership traditions weigh captain fields, captain patches, personality, mental abilities, awareness, toughness, confidence, class year, redshirt history, years with team, games played, games started, and downs played.
- Special-teams traditions weigh return production, kick-return ability, tackling, pursuit, speed, stamina, toughness, games played, and low-starting role-player usage.
- Home-state legacy traditions require matching home state and then weigh leadership, toughness, class year, and years with team.
- Reserved-number traditions move eligible non-NIL players off numbers that should generally not be issued.

Supported traditions include LSU #7 and #18, Texas A&M #12, Ole Miss #38, Ohio State #0, NC State #1, Northwestern #1, Virginia Tech #25, Montana #37, Montana State #41, Georgetown #35, Penn State #0 and #11, USC #55, Michigan #1, Temple and Baylor single digits, Syracuse #44 as reserved, and Army #12 as reserved.

LSU #18 can be awarded to any non-NIL Louisiana player on the roster. It only considers juniors and seniors, with class priority ordered as redshirt senior, senior, redshirt junior, then junior before leadership scoring is applied.

---

# Known Limitations

- Offensive linemen (LT, LG, C, RG, RT) are intentionally excluded from generic position renumbering. They can still be considered for configured team traditions.
- Specialists (K/P/LS) are intentionally excluded from generic position renumbering. They can still be considered for configured team traditions.
- QBs on the same team will sometime share numbers. This appears to be base game logic to prevent QBs from taking 20s or higher numbers.
- Walk-on status, weekly award selections, teammate voting, and depth chart order are not directly available in the save data, so those traditions are approximated from roster attributes and stats.
- Retired or symbolic reserve handling is limited to configured team traditions.

---

# Changelog

## Version 2.0

- Added Preview Only and Apply Changes run modes.
- Added optional team-specific jersey rules with scoring profiles for playmaker, leadership, special-teams, home-state legacy, single-digit, lineage, and reserved-number traditions.
- Added color-coded change, duplicate, displacement, and status logging.
- Added player class year to change logging.
- Reworked the final summary around clearer roster and change metrics.
- Preserved base-game QB-QB shared jersey numbers.

---

# Planned Additions

- Configurable tradition weights and enabled tradition list.
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
