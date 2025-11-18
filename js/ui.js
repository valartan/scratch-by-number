/* ----------------------------------------------
   ui.js : Animations UI & Helpers
---------------------------------------------- */

function pop(elem) {
    elem.classList.remove("pop");
    void elem.offsetWidth;
    elem.classList.add("pop");
}

function updateProgressUI(value) {
    const disp = document.getElementById("progressDisplay");
    disp.textContent = value + "%";
}
