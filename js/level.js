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
            top.location = "/"
        }
    } else {
        top.location = "/"
    }
    
}
async function loadLevel(levelNumber) {
    try {
        const response = await fetch(`/levels/${levelNumber}.json`);
        if (!response.ok) {
            throw new Error(`Failed to load level ${levelNumber}`);
        }
        const levelData = await response.json();
        document.getElementById("title").innerText = levelData.level.title
        initGrid(levelData.level.grid)
    } catch (error) {
        console.error(error.message);
    }
}
function initGrid(cells){
    let grid = ""
    cells.forEach(c => {
        grid += `<div class="cell" data-result="${c}"></div>`
    })
    document.getElementById("grid").insertAdjacentHTML("afterbegin", grid)
}