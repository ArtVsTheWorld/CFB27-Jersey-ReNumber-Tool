const fs = require("fs");
const path = require("path");
const prompt = require("prompt-sync")({ sigint: true });

/**
 * Return the default CFB 27 save path for the current user.
 */
function getDefaultSaveFolder() {
    return path.join(
        process.env.USERPROFILE,
        "Documents",
        "EA SPORTS College Football 27",
        "saves"
    );
}

/**
 * Prompt the user to choose a dynasty save from the save folder.
 */
function resolveSavePath() {
    const saveFolder = getDefaultSaveFolder();

    if (!fs.existsSync(saveFolder)) {
        throw new Error(`Save folder not found:\n${saveFolder}`);
    }

    const saves = fs.readdirSync(saveFolder)
        .filter(file => file.startsWith("DYNASTY-") && !file.endsWith(".bak"))
        .sort();

    if (saves.length === 0) {
        throw new Error("No dynasty saves were found.");
    }

    console.log("\nAvailable Dynasty Saves:\n");
    saves.forEach((save, index) => {
        console.log(`${index + 1}. ${save}`);
    });

    while (true) {
        const selection = prompt("Select a DYNASTY save number: ");
        const index = parseInt(selection, 10) - 1;

        if (!Number.isNaN(index) && index >= 0 && index < saves.length) {
            return path.join(saveFolder, saves[index]);
        }

        console.log("\nInvalid selection. Please try again.\n");
    }
}

module.exports = {
    resolveSavePath
};