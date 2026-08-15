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

async function compresserPhoto(fichier) {

    const MAX_SIZE = 1200;
    const QUALITE = 0.82;

    return new Promise((resolve, reject) => {

        const image = new Image();
        const url = URL.createObjectURL(fichier);

        image.onload = () => {

            let largeur = image.width;
            let hauteur = image.height;

            if (largeur > MAX_SIZE || hauteur > MAX_SIZE) {

                if (largeur > hauteur) {
                    hauteur = Math.round(hauteur * MAX_SIZE / largeur);
                    largeur = MAX_SIZE;
                } else {
                    largeur = Math.round(largeur * MAX_SIZE / hauteur);
                    hauteur = MAX_SIZE;
                }
            }

            const canvas = document.createElement("canvas");

            canvas.width = largeur;
            canvas.height = hauteur;

            const ctx = canvas.getContext("2d");

            ctx.drawImage(
                image,
                0,
                0,
                largeur,
                hauteur
            );

            canvas.toBlob(
                blob => {

                    URL.revokeObjectURL(url);

                    if (!blob) {
                        reject(new Error("Compression impossible"));
                        return;
                    }

                    resolve(
                        new File(
                            [blob],
                            "photo-voyage.jpg",
                            {
                                type: "image/jpeg"
                            }
                        )
                    );
                },
                "image/jpeg",
                QUALITE
            );
        };

        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Image impossible à charger"));
        };

        image.src = url;
    });
}

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
    const photoCompressee = await compresserPhoto(fichier);
    await enregistrerPhoto(id, photoCompressee);
}


    /* Message pour l'accueil */

    sessionStorage.setItem(
        "toastMessage",
        "✓ Voyage ajouté"
    );


    /* Retour accueil */

    window.location.href = "index.html";
});
