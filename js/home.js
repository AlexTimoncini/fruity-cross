async function getLevels() {
    try {
        const response = await fetch('./levels/levels.json');
        if (!response.ok) {
            throw new Error('Failed to load level manifest');
        }
        const manifest = await response.json();
        const levels = manifest.levels;
        console.log(levels)
        levels.forEach(l=>{
            let level = `
                <li class="level"><a href="#/level?l=${l}"><span>${l}</span></a></li>
            `
            document.getElementById("levels").insertAdjacentHTML("beforeend", level)
        })
    } catch (error) {
        console.error(error.message);
    }
}
init()
function init() {
    getLevels();
    document.getElementById("levels-btn").addEventListener("click", ()=>{
        document.getElementById("levels-wrapper").classList.add("active")
    })
    document.querySelector("#levels-wrapper .close-button").addEventListener("click", ()=>{
        document.getElementById("levels-wrapper").classList.remove("active")
    })
}
