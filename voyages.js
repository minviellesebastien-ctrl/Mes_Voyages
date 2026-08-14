const STORAGE_KEY = "mes-voyages";

const listeVoyages = document.getElementById("listeVoyages");
const retourVoyages = document.getElementById("retourVoyages");
const btnExporter = document.getElementById("btnExporter");
const btnImporter = document.getElementById("btnImporter");
const fichierImport = document.getElementById("fichierImport");

const btnEffacerTests = document.getElementById("btnEffacerTests");

btnEffacerTests.addEventListener("click", () => {
    localStorage.removeItem("mes-voyages");
    indexedDB.deleteDatabase("mes-voyages-db");

    location.reload();
});



/* =========================
   RETOUR
========================= */

retourVoyages.addEventListener("click", () => {
    window.location.href = "index.html";
});


/* =========================
   INDEXED DB
========================= */

function ouvrirDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open("mes-voyages-db", 1);

        request.onupgradeneeded = () => {
            const db = request.result;

            if (!db.objectStoreNames.contains("photos")) {
                db.createObjectStore("photos");
            }
        };

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
    });
}


function recupererPhoto(id) {
    return ouvrirDB().then(db => {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("photos", "readonly");
            const store = transaction.objectStore("photos");
            const request = store.get(id);

            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    });
}


/* =========================
   CARTE VOYAGE
========================= */

function creerIcone(type) {

    const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
    );

    svg.setAttribute("viewBox", "0 0 24 24");
    svg.setAttribute("aria-hidden", "true");

    if (type === "calendar") {
        svg.innerHTML = `
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <path d="M7 3v4M17 3v4M3 10h18"></path>
        `;
    }

    if (type === "location") {
        svg.innerHTML = `
            <path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11z"></path>
            <circle cx="12" cy="10" r="2"></circle>
        `;
    }

    if (type === "photo") {
        svg.innerHTML = `
            <rect x="3" y="5" width="18" height="16" rx="2"></rect>
            <circle cx="8.5" cy="10" r="1.5"></circle>
            <path d="M3 17l5-5 4 4 3-3 6 6"></path>
        `;
    }

    return svg;
}


async function creerCarte(voyage) {

    const carte = document.createElement("article");
    carte.className = "carte-voyage";

    const photo = document.createElement("div");
    photo.className = "photo-carte";

    const image = document.createElement("img");
    image.alt = voyage.ville || voyage.pays || "Voyage";

    try {
        const fichier = await recupererPhoto(voyage.id);

        if (fichier) {
            image.src = URL.createObjectURL(fichier);
        } else {
            image.classList.add("photo-manquante");
        }
    } catch {
        image.classList.add("photo-manquante");
    }

    photo.appendChild(image);

    const contenu = document.createElement("div");
    contenu.className = "contenu-carte";

    const pays = document.createElement("h2");
    pays.textContent = voyage.pays || "Voyage";

    const date = document.createElement("div");
    date.className = "ligne-voyage";
    date.appendChild(creerIcone("calendar"));

    const texteDate = document.createElement("span");
    texteDate.textContent = voyage.date || "";
    date.appendChild(texteDate);

    const localisation = document.createElement("div");
    localisation.className = "ligne-voyage";
    localisation.appendChild(creerIcone("location"));

    const texteVille = document.createElement("span");
    texteVille.textContent = voyage.ville || voyage.pays || "";
    localisation.appendChild(texteVille);

    contenu.appendChild(pays);
    contenu.appendChild(date);
    contenu.appendChild(localisation);

    const signet = document.createElement("span");
    signet.className = "signet-voyage";
    signet.setAttribute("aria-hidden", "true");

    carte.appendChild(photo);
    carte.appendChild(contenu);
    carte.appendChild(signet);

    const btnSupprimer = document.createElement("button");

    btnSupprimer.className = "btn-supprimer-voyage";
    btnSupprimer.type = "button";
    btnSupprimer.setAttribute(
        "aria-label",
        "Supprimer ce voyage"
    );

    btnSupprimer.innerHTML = `
        <svg viewBox="0 0 24 24">
            <path d="M6 6L18 18M18 6L6 18"/>
        </svg>
    `;

    btnSupprimer.addEventListener("click", (e) => {
        e.stopPropagation();
        afficherConfirmationSuppression(voyage);
    });

    carte.appendChild(btnSupprimer);

    return carte;
}

function fichierPhotoTexte(voyage) {
    return voyage.aPhotos === false ? "0 photos" : "1 photo";
}

/* =========================
   AFFICHER LES VOYAGES
========================= */

function dateDebutVoyage(dateTexte) {

    if (!dateTexte) return null;

    const mois = {
        janvier: 0,
        fevrier: 1,
        février: 1,
        mars: 2,
        avril: 3,
        mai: 4,
        juin: 5,
        juillet: 6,
        aout: 7,
        août: 7,
        septembre: 8,
        octobre: 9,
        novembre: 10,
        decembre: 11,
        décembre: 11
    };

    const texte = dateTexte
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

    let m = texte.match(
        /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[3]] !== undefined) {
        return new Date(Number(m[4]), mois[m[3]], Number(m[1]));
    }

    m = texte.match(
        /^(\d{1,2})\s+([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[2]] !== undefined) {
        return new Date(Number(m[3]), mois[m[2]], Number(m[1]));
    }

    m = texte.match(
        /^([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[1]] !== undefined) {
        return new Date(Number(m[2]), mois[m[1]], 1);
    }

    m = texte.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);

    if (m) {
        return new Date(
            Number(m[3]),
            Number(m[2]) - 1,
            Number(m[1])
        );
    }

    return null;
}


function trierVoyages(voyages) {

    return [...voyages].sort((a, b) => {

        const dateA = dateDebutVoyage(a.date);
        const dateB = dateDebutVoyage(b.date);

        if (dateA && dateB) {
            return dateB.getTime() - dateA.getTime();
        }

        if (dateA) return -1;
        if (dateB) return 1;

        return (b.creeLe || 0) - (a.creeLe || 0);
    });
}


/* =========================
   AFFICHER LES VOYAGES
========================= */

async function afficherVoyages() {

    const voyages =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    listeVoyages.innerHTML = "";

    if (voyages.length === 0) {

        const vide = document.createElement("div");
        vide.className = "liste-vide";
        vide.innerHTML = `
            <span>Aucun voyage enregistré</span>
        `;

        listeVoyages.appendChild(vide);
        return;
    }

    const voyagesTries = trierVoyages(voyages);

    for (const voyage of voyagesTries) {
        const carte = await creerCarte(voyage);
        listeVoyages.appendChild(carte);
    }
}


/* =========================
   EXPORT
========================= */

function blobEnDataURL(blob) {

    return new Promise((resolve, reject) => {

        if (!blob) {
            resolve(null);
            return;
        }

        const reader = new FileReader();

        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);

        reader.readAsDataURL(blob);
    });
}


btnExporter.addEventListener("click", async () => {

    const voyages =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const exportVoyages = [];

    for (const voyage of voyages) {

        const fichier = await recupererPhoto(voyage.id);

        exportVoyages.push({
            ...voyage,
            photo: await blobEnDataURL(fichier)
        });
    }

    const contenu = JSON.stringify(
        {
            version: 1,
            voyages: exportVoyages
        },
        null,
        2
    );

    const blob = new Blob(
        [contenu],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);

    const lien = document.createElement("a");
    lien.href = url;
    lien.download = "mes-voyages.json";
    lien.click();

    URL.revokeObjectURL(url);
});


/* =========================
   IMPORT
========================= */

btnImporter.addEventListener("click", () => {
    fichierImport.click();
});


function dataURLVersBlob(dataURL) {

    const parts = dataURL.split(",");
    const mime = parts[0].match(/:(.*?);/)[1];

    const bytes = atob(parts[1]);
    const array = new Uint8Array(bytes.length);

    for (let i = 0; i < bytes.length; i++) {
        array[i] = bytes.charCodeAt(i);
    }

    return new Blob([array], { type: mime });
}


async function enregistrerPhoto(id, blob) {

    if (!blob) return;

    const db = await ouvrirDB();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction("photos", "readwrite");

        const store =
            transaction.objectStore("photos");

        store.put(blob, id);

        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
    });
}


fichierImport.addEventListener("change", async () => {

    const fichier = fichierImport.files[0];

    if (!fichier) return;

    try {

        const texte = await fichier.text();
        const sauvegarde = JSON.parse(texte);

        if (!Array.isArray(sauvegarde.voyages)) {
            throw new Error("Format invalide");
        }

        const voyages = [];

        for (const voyage of sauvegarde.voyages) {

            const nouveauVoyage = {
                id: voyage.id || Date.now().toString(),
                pays: voyage.pays || "",
                ville: voyage.ville || "",
                date: voyage.date || "",
                creeLe: voyage.creeLe || Date.now()
            };

            voyages.push(nouveauVoyage);

            if (voyage.photo) {
                await enregistrerPhoto(
                    nouveauVoyage.id,
                    dataURLVersBlob(voyage.photo)
                );
            }
        }

        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(voyages)
        );

        await afficherVoyages();

    } catch (erreur) {

        console.error("Import impossible :", erreur);
    }

    fichierImport.value = "";
});


afficherVoyages();

function afficherConfirmationSuppression(voyage) {

    const overlay = document.createElement("div");

    overlay.className = "popup-suppression";

    overlay.innerHTML = `
        <div class="popup-suppression-contenu">

            <div class="popup-titre">
                Supprimer ce voyage ?
            </div>

            <div class="popup-boutons">

                <button class="popup-annuler">
                    ANNULER
                </button>

                <button class="popup-confirmer">
                    SUPPRIMER
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector(".popup-annuler")
        .addEventListener("click", () => {
            overlay.remove();
        });

    overlay.querySelector(".popup-confirmer")
        .addEventListener("click", async () => {

            await supprimerVoyage(voyage.id);

            overlay.remove();

            afficherVoyages();
        });
}

async function supprimerVoyage(id) {

    const voyages =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const nouveauxVoyages =
        voyages.filter(voyage => voyage.id !== id);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(nouveauxVoyages)
    );

    /* Suppression de la photo associée */

    try {

        const db = await ouvrirDB();

        await new Promise((resolve, reject) => {

            const transaction =
                db.transaction("photos", "readwrite");

            const store =
                transaction.objectStore("photos");

            const request = store.delete(id);

            request.onsuccess = resolve;
            request.onerror = () => reject(request.error);
        });

    } catch (erreur) {
        console.log("Photo non supprimée :", erreur);
    }
}
