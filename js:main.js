/* ----------------------------------------------
   main.js : Navigation + Packs + Niveaux
---------------------------------------------- */

document.addEventListener("DOMContentLoaded", () => {

    const page = document.body.classList[0];

    if (page === "page-home") loadPacks();
    if (page === "page-levels") loadLevels();
});


/* ----------------------------------------------
   1) Charger Packs sur index.html
---------------------------------------------- */

async function loadPacks() {
    const container = document.getElementById("packsContainer");

    const res = await fetch("data/packs.json");
    const packs = await res.json();

    packs.forEach(pack => {
        const div = document.createElement("div");
        div.className = "pack-card";
        div.onclick = () => {
            window.location.href = `levels.html?pack=${pack.id}`;
        };

        div.innerHTML = `
            <img src="${pack.icon}" class="pack-icon">
            <div class="pack-title">${pack.name}</div>
        `;

        container.appendChild(div);
    });
}


/* ----------------------------------------------
   2) Charger niveaux sur levels.html
---------------------------------------------- */

async function loadLevels() {
    const urlParams = new URLSearchParams(window.location.search);
    const packId = urlParams.get("pack");

    const res = await fetch("data/packs.json");
    const packs = await res.json();

    const pack = packs.find(p => p.id === packId);

    document.getElementById("packTitle").textContent = pack.name;

    const grid = document.getElementById("levelsGrid");

    pack.levels.forEach(level => {
        const div = document.createElement("div");
        div.className = "level-card";
        div.onclick = () => {
            window.location.href = `game.html?pack=${packId}&level=${level.id}`;
        };

        // progression
        const progress = localStorage.getItem(`progress_${packId}_${level.id}`) || 0;

        div.innerHTML = `
            <img class="level-thumb" src="${level.preview}">
            <div class="level-progress">${progress}%</div>
        `;

        grid.appendChild(div);
    });
}
