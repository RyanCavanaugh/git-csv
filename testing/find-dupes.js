const fs = require('fs');
const path = require('path');

const dirToRead = path.join(__dirname, '../embeds')

const embeds = [];

console.log("Reading files...");
for (const filename of fs.readdirSync(dirToRead)) {
    embeds.push(JSON.parse(fs.readFileSync(path.join(dirToRead, filename))));
}

/*
console.log("Checking for weirdness...");
let worstScore = 1;
for (let i = 0; i < embeds.length; i++) {
    let worstLocalScore = 0;
    for (let j = i + 1; j < embeds.length; j++) {
        const d = diff(embeds[i].vector, embeds[j].vector);
        worstLocalScore = Math.max(d, worstLocalScore);
    }
    if (worstLocalScore < worstScore) {
        console.log(`Weirdest issue is ${embeds[i].refs[0]} at ${worstScore}`);
        worstScore = worstLocalScore;
    }
}
*/
for (let i = 0; i < embeds.length; i++) {
    let matches = [embeds[i]];
    for (let j = i + 1; j < embeds.length; j++) {
        const d = diff(embeds[i].vector, embeds[j].vector);
        if (d > 0.95) {
            matches.push(embeds[j]);
            embeds.splice(j, 1);
        }
    }
    if (matches.length > 1) {
        console.log(`-- Here's a batch --`);
        for (const em of matches) {
            console.log(`${diff(matches[0].vector, em.vector).toFixed(3)}: ${em.refs[0]}`);
        }
    }
}

function diff(arr1, arr2) {
    let num = 0;
    let den1 = 0;
    let den2 = 0;
    for (let i = 0; i < arr1.length; i++) {
        num += arr1[i] * arr2[i];
        den1 += arr1[i] * arr1[i];
        den2 += arr2[i] * arr2[i];
    }
    return num / (Math.sqrt(den1) * Math.sqrt(den2));
}