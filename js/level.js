init()
function init(){
    let hash = window.location.hash,
        urlArr = hash.split("?")
    if(urlArr.length){
        let params = urlArr[1].split("&")
        if(params[0].startsWith("l=")){
            let level = params[0].split("=")[1]
            loadLevel(level);
        } else {
            top.location = "#/"
        }
    } else {
        top.location = "#/"
    }
    
}
async function loadLevel(levelNumber) {
    try {
        const response = await fetch(`./levels/${levelNumber}.json`);
        if (!response.ok) {
            alertGX(`Failed to load level ${levelNumber}`, "", false, ()=>{top.location = "#/"});
        }
        const levelData = await response.json();
        document.getElementById("title").innerText = levelData.level.title
        localStorage.setItem("level", levelData.level.title)
        initGrid(levelData.level.data)
    } catch (error) {
        alertGX(error.message);
    }
}
function initGrid(data){
    let grid = ""
    data.grid.forEach((cell, i) => {
        grid += `<div class="cell ${cell.placed ? "pre-placed" : ""}" id="cell_${i+1}" data-result="${cell.value}" ${cell.placed ? `data-disabled="true"` : ""}>${cell.placed ? `<img class="fruit-img" src="./assets/images/fruits/fruit_${cell.value}.png" alt="fruit image" draggable="false">` : ""}</div>`
    })
    document.getElementById("grid").insertAdjacentHTML("afterbegin", grid)
    initEvents(data)
    //CLOCK
    localStorage.setItem("timer", "0")
    setInterval(() => {
        let seconds = parseInt(localStorage.getItem("timer"));
        localStorage.setItem("timer", (seconds+1).toString())
        updateTimer();
    }, 1000);
    function updateTimer() {
        let seconds = parseInt(localStorage.getItem("timer"));
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if(document.getElementById("timer")) {
            document.getElementById("timer").innerText =
                `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        }
    }
    //END CLOCK
}
function initEvents(data) {
    initErrors(data.errors)
    localStorage.removeItem("activeFruit")
    let fruits = []
    for (let i = 1; i <= 10; i++) {
        let img = new Image()
        img.src = `./assets/images/fruits/fruit_${i}.png`
        img.classList.add("fruit-img")
        img.draggable = false
        fruits[i] = (img)
    }
    data.grid.forEach((c, i) => {
        let cell = document.getElementById("cell_"+(i+1))
        if(!c.placed){
            cell.addEventListener("click", ()=>{
                let activeFruit = parseInt(localStorage.getItem("activeFruit")) || false
                if(activeFruit){
                    cell.innerHTML = "";
                    let img = cell.querySelector("img");
                    if (!img) {
                        img = document.createElement("img");
                        img.classList.add("fruit-img");
                        img.draggable = false;
                        cell.appendChild(img);
                    }
                    img.src = fruits[activeFruit].src
                    if(activeFruit === c.value) {
                        if(cell.classList.contains("cell-error")){
                            cell.classList.remove("cell-error")
                        }
                        cell.classList.add("cell-right")
                        checkWin()
                    } else {
                        if(!cell.classList.contains("cell-error")){
                            cell.classList.add("cell-error")
                        }
                        newError()
                    }
                } else {
                    alert("Select a fruit first!")
                }
                initDB().then((db) => {
                    const key = localStorage.getItem("level")
                    const property = "placedCells"; // The property you want to update
                    const value = getGrid(); // The new value for the property

                    updateRecordProperty(db, key, property, value)
                        .then((updatedRecord) => {
                            console.log("Updated record:", updatedRecord);
                        })
                        .catch((error) => {
                            console.error("Error:", error);
                        });
                }).catch((error) => {
                    console.error("Error initializing the database:", error);
                });

            })
        }
    })
    document.querySelectorAll(".choose-fruit .fruit").forEach(f => {
        let fruit = f.dataset.fruit
        f.addEventListener("click", ()=>{
            if(f.classList.contains("active")){
                f.classList.remove("active")
                localStorage.setItem("activeFruit", "false")
            } else {
                let activeFruitEl = document.querySelector(".choose-fruit .fruit.active")
                if(activeFruitEl) {
                    activeFruitEl.classList.remove("active")
                }
                f.classList.add("active")
                localStorage.setItem("activeFruit", fruit)
            }
        })
    })
}
function initErrors(errors) {
    localStorage.setItem("maxErrors", errors)
    let errorBar = document.querySelector(".error-bar")
    let cross = `<div class="error"></div>`
    for(let i = 0; i < errors; i++){
        errorBar.insertAdjacentHTML("beforeend", cross)
    }
}
function newError() {
    document.querySelector(".error:last-child").remove()
    let errors = parseInt(localStorage.getItem("maxErrors"))
    if(errors > 1){
        localStorage.setItem("maxErrors", (errors-1)+"")
    } else {
        gameOver()
    }
}
function gameOver(){
    alertGX("Try again?","GAME OVER", true, ()=>{restartGame()}, ()=>{top.location = "#/"})
}
function checkWin(){
    let notCompleted = document.querySelectorAll("#grid .cell:not(.cell-right):not(.pre-placed)")
    if(notCompleted.length === 0){
        saveWin()
        alertGX("You must feel good uh!?", "VICTORY", false, ()=> {
            top.location = "#/"
        })
    }
}
function saveWin(){
    initDB().then((db) => {
        const newLevel = {
            title: localStorage.getItem("level"),
            completed: true,
            placedCells: []
        };
        upsertLevelByTitle(db, newLevel)
            .then((result) => {
                console.log("Operazione completata:", result);
            })
            .catch((error) => {
                console.error("Errore durante l'operazione:", error);
            });
    }).catch((error) => {
        console.error("Errore durante l'inizializzazione del database:", error);
    });
}
function restartGame(){
    initDB().then((db) => {
        const key = localStorage.getItem("level")
        const property = "placedCells"; // The property you want to update
        const value = []; // The new value for the property

        updateRecordProperty(db, key, property, value)
            .then((updatedRecord) => {
                location.reload()
            })
            .catch((error) => {
                console.error("Error:", error);
            });
    }).catch((error) => {
        console.error("Error initializing the database:", error);
    });
}
function upsertLevelByTitle(db, level) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("levels", "readwrite");
        const store = transaction.objectStore("levels");

        // Usa un indice o un cursor per verificare l'esistenza del titolo
        const indexRequest = store.openCursor();
        let found = false;

        indexRequest.onsuccess = (event) => {
            const cursor = event.target.result;

            if (cursor) {
                const existingLevel = cursor.value;

                // Controlla se il titolo corrisponde
                if (existingLevel.title === level.title) {
                    found = true;

                    // Aggiorna il record esistente
                    const updatedLevel = { ...existingLevel, ...level }; // Unisce i dati
                    cursor.update(updatedLevel);

                    console.log("Livello aggiornato con successo:", updatedLevel);
                    resolve(updatedLevel);
                } else {
                    cursor.continue();
                }
            } else if (!found) {
                // Se il titolo non esiste, aggiungi il nuovo livello
                const addRequest = store.add(level);

                addRequest.onsuccess = () => {
                    console.log("Livello aggiunto con successo:", level);
                    resolve(level);
                };

                addRequest.onerror = (event) => {
                    console.error("Errore durante l'aggiunta del livello:", event.target.error);
                    reject(event.target.error);
                };
            }
        };

        indexRequest.onerror = (event) => {
            console.error("Errore durante la ricerca del livello:", event.target.error);
            reject(event.target.error);
        };
    });
}
function updateRecordProperty(db, key, property, value) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("levels", "readwrite");
        const store = transaction.objectStore("levels");

        // Retrieve the record by its key (e.g., id or title)
        const getRequest = store.get(key);

        getRequest.onsuccess = (event) => {
            const record = event.target.result;

            if (record) {
                // Update only the specific property
                record[property] = value;

                // Save the updated record back into the database
                const updateRequest = store.put(record);

                updateRequest.onsuccess = () => {
                    console.log(`Record updated successfully: ${property} set to`, value);
                    resolve(record);
                };

                updateRequest.onerror = (event) => {
                    console.error("Error updating the record:", event.target.error);
                    reject(event.target.error);
                };
            } else {
                console.error("Record not found for key:", key);
                reject("Record not found");
            }
        };

        getRequest.onerror = (event) => {
            console.error("Error retrieving the record:", event.target.error);
            reject(event.target.error);
        };
    });
}
function getGrid() {

}