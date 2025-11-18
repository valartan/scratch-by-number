/* ----------------------------------------------
   loader.js : Charger un level (images + palette)
---------------------------------------------- */

async function loadLevel() {
    const urlParams = new URLSearchParams(window.location.search);
    const pack = urlParams.get("pack");
    const level = urlParams.get("level");

    const basePath = `assets/levels/${pack}/${level}/`;

    const meta = await fetch(basePath + "meta.json").then(r => r.json());
    const palette = await fetch(basePath + "palette.json").then(r => r.json());

    // Charger images
    const hiddenImg = await loadImage(basePath + "hidden.png");
    const indexImg = await loadImage(basePath + "indexMap.png");

    return {
        pack,
        level,
        meta,
        palette,
        hiddenImg,
        indexImg
    };
}

function loadImage(src) {
    return new Promise(res => {
        const img = new Image();
        img.src = src;
        img.onload = () => res(img);
    });
}
