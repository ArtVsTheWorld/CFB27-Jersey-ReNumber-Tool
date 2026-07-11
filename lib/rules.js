// ==========================================
// Jersey Number Rules
//
// Each position has:
//
// preferred:
//     Legal jersey number ranges.
//
// promoteChance:
//     Chance to move from the secondary range
//     into the 0-19 range.
//
// ==========================================

module.exports = {

    WR: {
        preferred: [[0, 19], [80, 89]],
        fallback: [[20, 39]],
        promoteChance: 0.65
    },

    HB: {
        preferred: [[0, 9], [20, 35]],
        fallback: [[36, 49]],
        promoteChance: 0.25
    },

    FB: {
        preferred: [[30, 49]],
        fallback: [[50, 59]]
    },

    QB: {
        preferred: [[1, 9], [10, 19]],
        fallback: [[20, 29]]
    },

    TE: {
        preferred: [[0, 19], [80, 89]],
        fallback: [[20, 59]],
        promoteChance: 0.15
    },


    LE: {
        preferred: [[0, 19], [90, 99]],
        fallback: [[30, 59]],
        promoteChance: 0.15
    },


    RE: {
        preferred: [[0, 19], [90, 99]],
        fallback: [[30, 59]],
        promoteChance: 0.15
    },

    DT: {
        preferred: [[90, 99], [0, 9]],
        fallback: [[50, 79]],
    },

    LOLB: {
        preferred: [[0, 19], [30, 59]],
        fallback: [[20, 29]],
        promoteChance: 0.20
    },

    MLB: {
        preferred: [[0, 19], [30, 59]],
        fallback: [[20, 29]],
        promoteChance: 0.25
    },

    ROLB: {
        preferred: [[0, 19], [30, 59]],
        fallback: [[20, 29]],
        promoteChance: 0.20
    },

    CB: {
        preferred: [[0, 9], [10, 33]],
        fallback: [[34, 44]],
        promoteChance: 0.50
    },

    FS: {
        preferred: [[0, 19], [20, 38]],
        fallback: [[39, 49]],
        promoteChance: 0.35
    }, 


    SS: {
        preferred: [[0, 19], [20, 38]],
        fallback: [[39, 49]],
        promoteChance: 0.25
    }

};