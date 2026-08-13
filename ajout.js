const retour = document.getElementById("retour");
const formVoyage = document.getElementById("formVoyage");
const photoInput = document.getElementById("photo");
const apercuPhoto = document.getElementById("apercuPhoto");

photoInput.addEventListener("change", () => {

    const fichier = photoInput.files[0];

    if (!fichier) return;

    const url = URL.createObjectURL(fichier);

    apercuPhoto.innerHTML = "";

    const image = document.createElement("img");

    image.src = url;

    apercuPhoto.appendChild(image);
});

const STORAGE_KEY = "mes-voyages";


/* =========================
   RETOUR
========================= */

retour.addEventListener("click", () => {
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

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


/* =========================
   ENREGISTRER PHOTO
========================= */

async function enregistrerPhoto(id, fichier) {

    if (!fichier) return;

    const db = await ouvrirDB();

    return new Promise((resolve, reject) => {

        const transaction = db.transaction("photos", "readwrite");

        const store = transaction.objectStore("photos");

        store.put(fichier, id);

        transaction.oncomplete = () => {
            resolve();
        };

        transaction.onerror = () => {
            reject(transaction.error);
        };
    });
}


/* =========================
   ENREGISTRER VOYAGE
========================= */

formVoyage.addEventListener("submit", async (e) => {

    e.preventDefault();

    const pays = document.getElementById("pays").value.trim();
    const ville = document.getElementById("ville").value.trim();
    const date = document.getElementById("date").value.trim();

    if (!pays || !date) {
        return;
    }

    const id = Date.now().toString();

    const voyage = {
        id: id,
        pays: pays,
        ville: ville,
        date: date,
        creeLe: Date.now()
    };


    /* Récupération des voyages existants */

    const voyages =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    voyages.push(voyage);

    localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(voyages)
    );


    /* Photo */

    const fichier = photoInput.files[0];

    if (fichier) {
        await enregistrerPhoto(id, fichier);
    }


    /* Message pour l'accueil */

    sessionStorage.setItem(
        "toastMessage",
        "✓ Voyage ajouté"
    );


    /* Retour accueil */

    window.location.href = "index.html";
});
