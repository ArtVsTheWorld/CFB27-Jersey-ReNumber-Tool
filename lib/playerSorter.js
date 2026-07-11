// ==========================================
// Player Sorter
//
// Sorts a roster so veteran and higher-rated
// players get first choice of jersey numbers.
//
// Priority:
//
// 1. School Year
// 2. Redshirt Status
// 3. OverallRating Rating
// ==========================================

// Ranking for player class.
//
// Larger number = higher priority.

const YEAR_PRIORITY = {

    Senior: 6,
    Junior: 4,
    Sophomore: 2,
    Freshman: 0

};

// ==========================================
// Position priority.
//
// Quarterbacks receive first choice because
// they have the smallest realistic jersey
// pool and are the most visible position.
// ==========================================

const POSITION_PRIORITY = {

    QB: 100,
    FB: -100

};

// ==========================================
// Returns a player's priority.
//
// Players who have already used a redshirt
// season ("Previous") receive a small boost
// over players of the same class who have
// not yet redshirted ("Eligible").
//
// This better reflects time spent in the
// program, which influences jersey selection.
// ==========================================

function getPriority(player) {

    let priority =
    YEAR_PRIORITY[player.SchoolYear] ?? 0;

    // Give certain positions additional priority.
    priority +=
        POSITION_PRIORITY[player.Position] ?? 0;

    // Players who have already completed a
    // redshirt season receive higher priority
    // than true classmates.
    if (player.RedshirtStatus === "Previous") {
        priority += 1;
    }

    return priority;

}

// ==========================================
// Sort roster in-place.
//
// Higher priority players come first.
//
// If priorities match, OverallRating decides.
//
// ==========================================

function sortRoster(roster) {

    roster.sort((a, b) => {

        const priorityDifference =
            getPriority(b) - getPriority(a);

        if (priorityDifference !== 0)
            return priorityDifference;

        return b.OverallRating - a.OverallRating;

    });

}

module.exports = {
    sortRoster
};