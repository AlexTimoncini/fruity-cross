async function getLevels(completed) {
    completed.sort()
    try {
        const response = await fetch('./levels/levels.json');
        if (!response.ok) {
            throw new Error('Failed to load level manifest');
        }
        const manifest = await response.json();
        const levels = manifest.levels;
        console.log(levels)
        console.log(completed)
        levels.forEach(l=>{
            let isLocked = (l.toString() !== "1"  && l !== (parseInt(completed[completed.length - 1]) + 1).toString()) && !completed.includes(l)
            let level = `
                <li class="level ${isLocked ? 'locked' : (completed.includes(l) ? 'completed' : '')}"><a href="#/level?l=${l}"><span>${isLocked ? '<img src="./assets/images/lock.svg" alt="lock img">' : l}</span></a></li>
            `
            document.getElementById("levels").insertAdjacentHTML("beforeend", level)
        })
    } catch (error) {
        console.error(error.message);
    }
}
init()
function init() {
    document.getElementById("levels-btn").addEventListener("click", ()=>{
        document.getElementById("levels-wrapper").classList.add("active")
    })
    document.querySelector("#levels-wrapper .close-button").addEventListener("click", ()=>{
        document.getElementById("levels-wrapper").classList.remove("active")
    })
    function getCompletedLevels(db) {
        return new Promise((resolve, reject) => {
            const transaction = db.transaction("levels", "readonly");
            const store = transaction.objectStore("levels");
            const completedLevels = [];
            const request = store.openCursor();
            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    const record = cursor.value;
                    if (record.completed === true) {
                        completedLevels.push(record.title);
                    }
                    cursor.continue();
                } else {
                    resolve(completedLevels);
                }
            };
            request.onerror = (event) => {
                console.error("Errore durante la lettura dei livelli:", event.target.error);
                reject(event.target.error);
            };
        });
    }
    initDB().then((db) => {
        getCompletedLevels(db)
            .then((levels) => {
                getLevels(levels);

            })
            .catch((error) => {
                console.error("Errore durante l'estrazione dei livelli completati:", error);
            });
    }).catch((error) => {
        console.error("Errore durante l'inizializzazione:", error);
    });
}
