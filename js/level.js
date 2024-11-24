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
    if(localStorage.getItem("interval")) {
        clearInterval(parseInt(localStorage.getItem("interval")))
    }
}
async function loadLevel(levelNumber) {
    try {
        const response = await fetch(`./levels/${levelNumber}.json`);
        if (!response.ok) {
            alertGX(`Failed to load level ${levelNumber}`, "", false, ()=>{top.location = "#/"});
        }
        const levelData = await response.json();
        document.getElementById("title").innerText = "Level "+levelData.level.title
        localStorage.setItem("level", levelData.level.title)
        createLevel(levelData.level.title, levelData.level.data.errors)
        initGrid(levelData.level.data, levelData.level.title)
    } catch (error) {
        alertGX(error.message);
    }
}
async function initGrid(data, level){
    let grid = ""
    let preloadData = [],
        placedCells = []
    await preloadLevel(level).then((result)=>{
        preloadData = result
        console.log(result)
        placedCells = JSON.parse(preloadData.placedCells)
        initErrors(data.errors, preloadData.lives)
        localStorage.setItem("timer", preloadData.time)
    }).catch(error=>{console.log(error)})
    data.grid.forEach((cell, i) => {
        let id = i+1,
            placed = placedCells.find(obj => {
                return parseInt(obj.i) === id
            })
            console.log(placed)
        grid += `<div class="cell ${cell.placed ? "pre-placed" : (placed !== undefined ? (placed.err ? "cell-error" : "cell-right") : "")}" id="cell_${id}" data-result="${cell.value}" ${cell.placed ? `data-disabled="true"` : ""}>${cell.placed ? `<img class="fruit-img" src="./assets/images/fruits/fruit_${cell.value}.png" alt="fruit image" draggable="false">` : (placed !== undefined ? `<img class="fruit-img" src="./assets/images/fruits/fruit_${placed.v}.png" alt="fruit image" draggable="false">` : "")}</div>`
    })
    document.getElementById("grid").insertAdjacentHTML("afterbegin", grid)
    initEvents(data)
    //CLOCK
    let interval = setInterval(() => {
        let seconds = parseInt(localStorage.getItem("timer")) || 0;
        localStorage.setItem("timer", (seconds+1).toString())
        updateTimer();
    }, 1000);
    localStorage.setItem("interval", interval.toString())
    function updateTimer() {
        let seconds = parseInt(localStorage.getItem("timer")),
            level = localStorage.getItem("level")
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if(document.getElementById("timer")) {
            document.getElementById("timer").innerText =
                `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
        }
        initDB().then((db) => {
            setProp(db, level, ['time'], [seconds]).then()
        }).catch((error) => {
            console.error("Errore durante l'inizializzazione del database:", error)
        })
    }
    //END CLOCK
}
function initEvents(data) {
    localStorage.removeItem("activeFruit")
    let fruits = []
    for (let i = 1; i <= 5; i++) {
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
                event.stopPropagation()
                event.preventDefault()
                let activeFruit = parseInt(localStorage.getItem("activeFruit")) || false
                if(activeFruit){
                    cell.innerHTML = "";
                    let img = cell.querySelector("img")
                    if (!img) {
                        img = document.createElement("img")
                        img.classList.add("fruit-img")
                        img.draggable = false
                        cell.appendChild(img)
                    }
                    img.src = fruits[activeFruit].src
                    if(activeFruit === parseInt(c.value)) {
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
            })
        }
    }, false)
    const grid = document.getElementById("grid")
    let isDragging = false,
        dragTimeout;
    const fillCell = (cell) => {
        if (!cell.innerHTML) {
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
                if(activeFruit === parseInt(cell.dataset.result)) {
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
        }
    };
    const startDrag = (event) => {
        if (event.target.classList.contains("cell") && !event.target.innerHTML) {
            dragTimeout = setTimeout(() => {
                isDragging = true;
                fillCell(event.target);
            }, 150);
        }
    };
    const dragOver = (event) => {
        if (!isDragging) return;
        const target = document.elementFromPoint(
            event.touches ? event.touches[0].clientX : event.clientX,
            event.touches ? event.touches[0].clientY : event.clientY
        );
        if (target && target.classList.contains("cell") && !target.innerHTML) {
            fillCell(target)
        }
    }
    const stopDrag = (event) => {
        clearTimeout(dragTimeout)
        isDragging = false
    }
    grid.addEventListener("mousedown", startDrag)
    grid.addEventListener("mousemove", dragOver)
    document.addEventListener("mouseup", stopDrag)
    grid.addEventListener("touchstart", startDrag)
    grid.addEventListener("touchmove", dragOver)
    document.addEventListener("touchend", stopDrag)
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
function initErrors(errors, lives) {
    localStorage.setItem("maxErrors", errors)
    localStorage.setItem("lives", lives)
    console.log(lives, "dasdsad")
    let errorBar = document.querySelector(".error-bar")
    let hearts = ""
    for(let i = 1; i <= errors; i++){
        hearts += `<div class="heart${i<=lives ? "" : " crossed"}"><img src="./assets/images/heart.png"></div>`
    }
    errorBar.insertAdjacentHTML("beforeend", hearts)
}
function newError() {
    let hearts = document.querySelectorAll(".heart:not(.crossed)")
    hearts[hearts.length -1].classList.add("crossed")
    let lives = parseInt(localStorage.getItem("lives"))
    if(lives > 1){
        localStorage.setItem("lives", (lives-1)+"")
        initDB().then((db) => {
            let level = localStorage.getItem("level")
            setProp(db, level, ['lives'], [lives-1]).then()
        }).catch((error) => {
            console.error("Errore durante l'inizializzazione del database:", error);
        });
        save()
    } else {
        gameOver()
    }
}
function gameOver(){
    restartGame()
    alertGX("Try again?","GAME OVER", true, ()=>{location.reload()}, ()=>{top.location = "#/"})
}
function checkWin(){
    let notCompleted = document.querySelectorAll("#grid .cell:not(.cell-right):not(.pre-placed)")
    if(notCompleted.length === 0){
        saveWin()
        document.getElementById("alert_win").classList.add("active")
        if(!document.getElementById("backdrop").classList.contains("active")){
            document.getElementById("backdrop").classList.add("active")
        }
        let seconds = parseInt(localStorage.getItem("timer")),
            minutes = Math.floor(seconds / 60),
            remainingSeconds = seconds % 60;
        if(document.querySelector("#alert_win .level-mess")) {
            document.querySelector("#alert_win .level-mess").innerText.replace('{{timer}}', `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`);
        }
    } else {
        save()
    }
}
function saveWin(){
    if(localStorage.getItem("interval")) {
        clearInterval(parseInt(localStorage.getItem("interval")))
    }
    initDB().then((db) => {
        let level = localStorage.getItem("level")
        const newLevel = {
            title: level,
            completed: true,
            placedCells: "[]",
            time: 0
        };
        setProp(db, level, ['completed', 'placedCells', 'time'], [true, "[]", 0])
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
        const level = localStorage.getItem("level"),
            lives = parseInt(localStorage.getItem("maxErrors"))
        localStorage.setItem("lives", lives.toString())
        localStorage.setItem("timer", "0")
        if(localStorage.getItem("interval")) {
            clearInterval(parseInt(localStorage.getItem("interval")))
        }
        console.log("resetting")
        setProp(db, level, ['time', 'placedCells', 'lives'], [0, "[]", lives]).then()
    })
}
function setProp(db, key, props, values) {
    key = parseInt(key)
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("levels", "readwrite")
        const store = transaction.objectStore("levels")
        const index = store.index("titleIndex")
        const getRequest = index.get(key)
        getRequest.onsuccess = (event) => {
            const existingLevel = event.target.result;
            if (existingLevel) {
                props.forEach((p, i) => {
                    existingLevel[p] = values[i]
                })
                console.log("setting", existingLevel)
                const updateRequest = store.put(existingLevel);
                updateRequest.onsuccess = () => {
                    resolve(existingLevel)
                }
                updateRequest.onerror = (event) => {
                    reject(event.target.error)
                }
            } else {
                reject(new Error(`Livello con titolo "${key}" non trovato.`));
            }
        }
        getRequest.onerror = (event) => {
            reject(event.target.error);
        };
    });
}
function getGrid() {
    let grid = []
    document.querySelectorAll("#grid .cell").forEach(cell => {
        let id = cell.id.replace("cell_", "")
        if(!cell.classList.contains("pre-placed") && cell.innerHTML){
            if(cell.classList.contains("cell-right")){
                grid.push({i: id, v: cell.dataset.result, err: false})
            } else if (cell.classList.contains("cell-error")) {
                grid.push({i: id, v: (cell.dataset.result === "1" ? "2" : "1"), err: true})
            }
        }
    })
    console.log(grid)
    return grid
}
function updateGrid(db, level, empty=false, lives= 0){
    let grid = []
    if(!empty){
        grid = getGrid()
    }
    let props = ['placedCells'],
        values = [JSON.stringify(grid)]

    if(lives){
        props.push('lives')
        values.push(lives)
    }
    return setProp(db, level, props, values)
}
function preloadLevel(level){
    return new Promise((resolve, reject) => {
        initDB().then((db) => {
            getLevel(db, level)
                .then((result) => {
                    resolve(result)
                })
                .catch((error) => {
                    reject(error.target.error)
                })
        }).catch((error) => {
            reject(error.target.error)
        })
    })
}
function createLevel(level, lives){
    let obj = {
        title: level,
        completed: false,
        placedCells: "[]",
        time: 1,
        lives: lives
    }
    initDB().then((db) => {
        create(db, obj)
            .then((result) => {
                if (result.status === "added") {
                    console.log("Nuovo livello aggiunto:", result.level)
                } else {
                    console.log("Il livello esiste già:", result.level)
                }
            })
            .catch((error) => {
                console.error("Errore:", error)
            })
    }).catch((error) => {
        console.error("Error initializing the database:", error)
    })
}
function create(db, level) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("levels", "readwrite");
        const store = transaction.objectStore("levels");
        let indexRequest = store.openCursor(),
            exists = false;
        indexRequest.onsuccess = (event) => {
            const cursor = event.target.result;
            if (cursor) {
                const record = cursor.value;
                if (record.title === level.title) {
                    exists = true
                    resolve({ status: "exists", level: record })
                    return
                }
                cursor.continue()
            } else if (!exists) {
                const addRequest = store.add(level)
                addRequest.onsuccess = () => {
                    resolve({ status: "added", level });
                }
                addRequest.onerror = (error) => {
                    reject(error.target.error);
                }
            }
        }
        indexRequest.onerror = (error) => {
            reject(error.target.error)
        }
    })
}
function getLevel(db, level) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction("levels", "readonly")
        const store = transaction.objectStore("levels")
        const indexRequest = store.openCursor()
        indexRequest.onsuccess = (event) => {
            const cursor = event.target.result
            if (cursor) {
                const record = cursor.value
                if (record.title === level) {
                    resolve(record)
                    return
                }
                cursor.continue()
            } else {
                reject(new Error("Livello non trovato"))
            }
        }
        indexRequest.onerror = (error) => {
            reject(error.target.error)
        }
    })
}
function save(){
    initDB().then((db) => {
        const level = localStorage.getItem("level")
        updateGrid(db, level, false, parseInt(localStorage.getItem("lives")))
            .then((updatedRecord) => {
                console.log("Updated record:", updatedRecord)
            })
            .catch((error) => {
                console.error("Error:", error)
            });
    }).catch((error) => {
        console.error("Error initializing the database:", error)
    })
}