/* ============================================================
   game.js – Moteur complet du Scratch by Number
   Compatible iPhone / Android / PC
   Canvas superposés : hiddenCanvas (image), maskCanvas (grattage)
   Zoom + Pan + Scratch tactile
   ============================================================ */

let hiddenCanvas, hiddenCtx;
let maskCanvas, maskCtx;

let level;
let gridSize;
let palette = [];

let activeColor = 0;      // index couleur sélectionnée
let revealed = [];        // tableau booléen 200x200
let totalPixels = 0;
let revealedPixels = 0;

let scale = 1;
let offsetX = 0;
let offsetY = 0;
let dragging = false;
let lastX = 0, lastY = 0;

let isScratching = false;


/* ============================================================
   INIT
============================================================ */

window.addEventListener("DOMContentLoaded", async () => {

    hiddenCanvas = document.getElementById("hiddenCanvas");
    maskCanvas   = document.getElementById("maskCanvas");

    hiddenCtx = hiddenCanvas.getContext("2d");
    maskCtx   = maskCanvas.getContext("2d");

    level = await loadLevel();

    gridSize = level.meta.size;
    palette  = level.palette;

    // Taille canvas = taille écran (portrait)
    resizeCanvas();

    // dessiner hidden.png
    hiddenCtx.drawImage(level.hiddenImg, 0, 0, hiddenCanvas.width, hiddenCanvas.height);

    // masque noir initial
    maskCtx.fillStyle = "black";
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);

    prepareLogic();

    setupColorButtons();
    setupEvents();
});


/* ============================================================
   RESPONSIVE CANVAS
============================================================ */

function resizeCanvas() {
    const wrapper = document.querySelector(".game-wrapper");
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;

    hiddenCanvas.width  = w;
    hiddenCanvas.height = h;

    maskCanvas.width  = w;
    maskCanvas.height = h;
}


/* ============================================================
   LOGIQUE DU NIVEAU
============================================================ */

function prepareLogic() {
    revealed = new Array(gridSize * gridSize).fill(false);
    totalPixels = gridSize * gridSize;

    // Charger progression si existe
    const key = `progress_mask_${level.pack}_${level.level}`;
    const savedMask = localStorage.getItem(key);
    if (savedMask) {
        const img = new Image();
        img.src = savedMask;
        img.onload = () => {
            maskCtx.drawImage(img, 0, 0, maskCanvas.width, maskCanvas.height);
        };
    }
}


/* ============================================================
   COULEURS
============================================================ */

function setupColorButtons() {
    const bar = document.getElementById("colorBar");

    palette.forEach((col, i) => {
        const btn = document.createElement("button");
        btn.className = "color-btn";
        btn.style.background = `rgb(${col.r},${col.g},${col.b})`;
        btn.onclick = () => selectColor(i, btn);
        bar.appendChild(btn);

        if (i === 0) {
            selectColor(0, btn);
        }
    });
}

function selectColor(index, btn) {
    activeColor = index;

    document.querySelectorAll(".color-btn").forEach(b => b.classList.remove("active"));

    if (btn) {
        btn.classList.add("active");
        pop(btn);
    }
}


/* ============================================================
   SCRATCH
============================================================ */

function scratchAt(screenX, screenY) {

    // convertir en coordonnées canvas
    const rect = maskCanvas.getBoundingClientRect();
    const x = (screenX - rect.left - offsetX) / scale;
    const y = (screenY - rect.top  - offsetY) / scale;

    // convertir en pixel indexMap
    const px = Math.floor((x / maskCanvas.width) * gridSize);
    const py = Math.floor((y / maskCanvas.height) * gridSize);

    if (px < 0 || py < 0 || px >= gridSize || py >= gridSize) return;

    // lire indexMap pixel
    const ratioX = px / gridSize * level.indexImg.width;
    const ratioY = py / gridSize * level.indexImg.height;

    const ctxTmp = document.createElement("canvas").getContext("2d");
    ctxTmp.canvas.width  = level.indexImg.width;
    ctxTmp.canvas.height = level.indexImg.height;

    ctxTmp.drawImage(level.indexImg, 0, 0);

    const pixel = ctxTmp.getImageData(Math.floor(ratioX), Math.floor(ratioY), 1, 1).data;
    const indexVal = pixel[0]; // index couleur 0-255

    if (indexVal !== activeColor) return;

    // scratch = efface zone
    maskCtx.save();
    maskCtx.globalCompositeOperation = "destination-out";
    maskCtx.beginPath();
    maskCtx.arc(x, y, 20, 0, Math.PI * 2);
    maskCtx.fill();
    maskCtx.restore();

    updateProgress(px, py);
}


/* ============================================================
   PROGRESSION
============================================================ */

function updateProgress(px, py) {
    const idx = py * gridSize + px;

    if (!revealed[idx]) {
        revealed[idx] = true;
        revealedPixels++;
    }

    const percent = Math.floor((revealedPixels / totalPixels) * 100);
    updateProgressUI(percent);

    // Sauvegarde progression du niveau
    const key = `progress_${level.pack}_${level.level}`;
    localStorage.setItem(key, percent);

    // Sauvegarder masque (png)
    const maskKey = `progress_mask_${level.pack}_${level.level}`;
    localStorage.setItem(maskKey, maskCanvas.toDataURL());
}


/* ============================================================
   GESTION DES ÉVÉNEMENTS
============================================================ */

function setupEvents() {

    /* --- Souris --- */
    maskCanvas.addEventListener("mousedown", e => {
        isScratching = true;
        scratchAt(e.clientX, e.clientY);
    });

    window.addEventListener("mouseup", () => isScratching = false);

    maskCanvas.addEventListener("mousemove", e => {
        if (isScratching) scratchAt(e.clientX, e.clientY);
    });


    /* --- Touch (iPhone/Android) --- */
    maskCanvas.addEventListener("touchstart", e => {
        e.preventDefault();
        isScratching = true;
        const t = e.touches[0];
        scratchAt(t.clientX, t.clientY);
    }, { passive: false });

    maskCanvas.addEventListener("touchmove", e => {
        e.preventDefault();
        if (!isScratching) return;
        const t = e.touches[0];
        scratchAt(t.clientX, t.clientY);
    }, { passive: false });

    maskCanvas.addEventListener("touchend", () => {
        isScratching = false;
    });


    /* =======================================================
       ZOOM au pinch
    ======================================================= */

    let lastDist = 0;

    maskCanvas.addEventListener("touchmove", e => {

        if (e.touches.length === 2) {
            e.preventDefault();

            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;

            const dist = Math.sqrt(dx * dx + dy * dy);

            if (lastDist === 0) { lastDist = dist; return; }

            const delta = dist - lastDist;
            lastDist = dist;

            scale += delta * 0.002;
            scale = Math.max(1, Math.min(scale, 4));
            applyTransform();
        }
    });

    maskCanvas.addEventListener("touchend", () => {
        lastDist = 0;
    });


    /* =======================================================
       PAN (drag déplacement)
    ======================================================= */

    maskCanvas.addEventListener("mousedown", e => {
        dragging = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });

    window.addEventListener("mouseup", () => dragging = false);

    window.addEventListener("mousemove", e => {
        if (dragging && !isScratching) {
            offsetX += (e.clientX - lastX);
            offsetY += (e.clientY - lastY);
            lastX = e.clientX;
            lastY = e.clientY;
            applyTransform();
        }
    });

    // Touch drag
    maskCanvas.addEventListener("touchmove", e => {
        if (e.touches.length === 1 && !isScratching) {
            const t = e.touches[0];
            offsetX += (t.clientX - lastX);
            offsetY += (t.clientY - lastY);
            lastX = t.clientX;
            lastY = t.clientY;
            applyTransform();
        }
    });
}


/* ============================================================
   APPLIQUER TRANSFORM (scale + offset)
============================================================ */

function applyTransform() {
    hiddenCanvas.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
    maskCanvas.style.transform   = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
}
