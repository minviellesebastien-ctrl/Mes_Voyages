const btnAjouter = document.getElementById("btnAjouter");
const btnVoyages = document.getElementById("btnVoyages");
const tamponVoyage = document.getElementById("tamponVoyage");
const tamponDate = document.getElementById("tamponDate");
const infosProchainVoyage =
    document.getElementById("infosProchainVoyage");

const infoPays =
    document.getElementById("infoPays");

const infoVille =
    document.getElementById("infoVille");

const infoDate =
    document.getElementById("infoDate");


btnAjouter.addEventListener("click", () => {
    window.location.href = "ajout.html";
});


btnVoyages.addEventListener("click", () => {
    window.location.href = "voyages.html";
});

const boutonCarte = document.getElementById("boutonCarte");

boutonCarte.addEventListener("click", () => {
    window.location.href = "carte.html";
});

const STORAGE_KEY = "mes-voyages";

const photoProchainVoyage =
    document.getElementById("photoProchainVoyage");

const voyageVide =
    document.getElementById("voyageVide");


/* =========================
   OUVRIR INDEXED DB
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
   RÉCUPÉRER UNE PHOTO
========================= */

async function recupererPhoto(id) {

    const db = await ouvrirDB();

    return new Promise((resolve, reject) => {

        const transaction =
            db.transaction("photos", "readonly");

        const store =
            transaction.objectStore("photos");

        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result);
        };

        request.onerror = () => {
            reject(request.error);
        };
    });
}


/* =========================
   AFFICHER LE VOYAGE
========================= */

function analyserDateVoyage(dateTexte) {

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

    /*
       Formats acceptés :

       10-15 août 2026
       10 – 15 août 2026
       10 août 2026
       août 2026
       10/08/2026
    */

    let m = texte.match(
        /^(\d{1,2})\s*[-–—]\s*(\d{1,2})\s+([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[3]] !== undefined) {

        const debut = new Date(
            Number(m[4]),
            mois[m[3]],
            Number(m[1])
        );

        const fin = new Date(
            Number(m[4]),
            mois[m[3]],
            Number(m[2])
        );

        return { debut, fin };
    }

    m = texte.match(
        /^(\d{1,2})\s+([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[2]] !== undefined) {

        const date = new Date(
            Number(m[3]),
            mois[m[2]],
            Number(m[1])
        );

        return { debut: date, fin: date };
    }

    m = texte.match(
        /^([a-zàâäéèêëîïôöùûüÿç]+)\s+(\d{4})$/
    );

    if (m && mois[m[1]] !== undefined) {

        const debut = new Date(
            Number(m[2]),
            mois[m[1]],
            1
        );

        const fin = new Date(
            Number(m[2]),
            mois[m[1]] + 1,
            0
        );

        return { debut, fin };
    }

    m = texte.match(
        /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/
    );

    if (m) {

        const date = new Date(
            Number(m[3]),
            Number(m[2]) - 1,
            Number(m[1])
        );

        return { debut: date, fin: date };
    }

    return null;
}


function voyagePourAccueil(voyages) {

    const aujourdHui = new Date();

    const valides = voyages
        .map(voyage => ({
            voyage,
            dates: analyserDateVoyage(voyage.date)
        }))
        .filter(x => x.dates !== null);

    /* 1. Voyage actuellement en cours.
       La date de fin est incluse. */

    const enCours = valides
        .filter(x =>
            aujourdHui >= x.dates.debut &&
            aujourdHui <= x.dates.fin
        )
        .sort((a, b) => a.dates.debut - b.dates.debut);

    if (enCours.length) {
        return enCours[0].voyage;
    }

    /* 2. Sinon, prochain voyage le plus proche. */

    const prochains = valides
        .filter(x => x.dates.debut > aujourdHui)
        .sort((a, b) => a.dates.debut - b.dates.debut);

    if (prochains.length) {
        return prochains[0].voyage;
    }

    /* 3. Aucun voyage actuel ni futur. */

    return null;
}


function afficherAccueilVide() {

    photoProchainVoyage.src = "";
    photoProchainVoyage.hidden = true;

    voyageVide.style.display = "";

    infosProchainVoyage.hidden = true;
    tamponVoyage.hidden = true;
}


/* =========================
   AFFICHER LE VOYAGE ACCUEIL
========================= */

async function afficherProchainVoyage() {

    const voyages =
        JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];

    const voyage = voyagePourAccueil(voyages);

    if (!voyage) {
        afficherAccueilVide();
        return;
    }

    voyageVide.style.display = "none";

    infoPays.textContent = voyage.pays || "";
    infoVille.textContent = voyage.ville || "";
    infoDate.textContent = voyage.date || "";

    infosProchainVoyage.hidden = false;

    tamponDate.textContent = voyage.date || "";
    tamponVoyage.hidden = false;

    /* La photo est facultative : le voyage reste affiché
       même si aucune photo n'est disponible. */
    const photo = await recupererPhoto(voyage.id);

    if (photo) {
        const url = URL.createObjectURL(photo);
        photoProchainVoyage.src = url;
        photoProchainVoyage.hidden = false;
    } else {
        photoProchainVoyage.src = "";
        photoProchainVoyage.hidden = true;
    }
}


afficherProchainVoyage();

const toastMsg = sessionStorage.getItem("toastMessage");

if (toastMsg) {

    sessionStorage.removeItem("toastMessage");

    const toast = document.createElement("div");

    toast.className = "toast";

    if (toastMsg.startsWith("✓")) {

        toast.innerHTML =
            "<span class='check'>✓</span>" +
            toastMsg.substring(1);

    } else {

        toast.textContent = toastMsg;
    }

    document.body.appendChild(toast);

    requestAnimationFrame(() => {
        toast.classList.add("show");
    });

    if (navigator.vibrate) {
        navigator.vibrate(20);
    }

    setTimeout(() => {

        toast.classList.remove("show");

        setTimeout(() => {
            toast.remove();
        }, 300);

    }, 2200);
}
