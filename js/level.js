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
        document.getElementById("timer").innerText =
            `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
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
                    img.src = fruits[activeFruit]
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
    console.log("save db")
}
function restartGame(){
    console.log("reset db")
    location.reload()
}