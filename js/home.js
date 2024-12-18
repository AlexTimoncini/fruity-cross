async function buildLevels(completed) {
    completed.sort()
    await getLevels().then(result => {
        result.forEach(l=>{
            let isLocked = (l.toString() !== "1"  && l !== (parseInt(completed[completed.length - 1]) + 1).toString()) && !completed.includes(l)
            let level = `
            <li class="level ${isLocked ? 'locked' : (completed.includes(l) ? 'completed' : '')}"><a href="#/level?l=${l}"><span style="width:100%">${isLocked ? '<img src="./assets/images/lock.svg" alt="lock img">' : l}</span></a></li>
        `
            document.getElementById("levels").insertAdjacentHTML("beforeend", level)
        })
    }).catch(err => console.log(err))
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
                        completedLevels.push(record.title.toString())
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
                buildLevels(levels);
            })
            .catch((error) => {
                console.error("Errore durante l'estrazione dei livelli completati:", error);
            });
    }).catch((error) => {
        console.error("Errore durante l'inizializzazione:", error);
    })
    if(localStorage.getItem("interval")) {
        clearInterval(parseInt(localStorage.getItem("interval")))
    }
    localStorage.setItem("timer", 0)
}
