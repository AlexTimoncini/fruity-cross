/* ALERT MANAGEMENT */
let lastTimeoutID;
function alert(msg, type, errorSelector=false){
    //eliminiamo alert già aperti
    let oldAlerts = document.querySelectorAll('.alert')
    oldAlerts.forEach(el=>{
        let id = el.dataset.id
        removeAlert(id, false, lastTimeoutID)
    })
    let alert_id = Date.now()
    let html = `
    <div class="alert" data-id="${alert_id}">
        <div class="${type}-icon"></div>
        <p class="alert-msg">${msg}</p>
        <div class="close-button" onclick="hideAlert('${alert_id}', '${errorSelector || ''}')"></div>
        <div class="alert-progress"></div>
    </div>
    `
    if (errorSelector) {
        let els = document.querySelectorAll(errorSelector)
        els.forEach(el=> {
            el.classList.add('error')
            el.parentNode.addEventListener("click", ()=> {
                if(el.classList.contains('error')) el.classList.remove('error')
            })
        })
    }
    document.querySelector("body").insertAdjacentHTML("afterbegin", html)
    lastTimeoutID = setTimeout(()=>removeAlert(alert_id, errorSelector, lastTimeoutID), 5000)
}

function hideAlert(id, errorSelector=false){
    if (errorSelector) {
        let els = document.querySelectorAll(errorSelector)
        els.forEach(el=>el.classList.remove('error'))
    }
    document.querySelector(".alert[data-id='"+id+"']").style.display = 'none'
}

function removeAlert(id, errorSelector=false, timeoutId){
    clearTimeout(timeoutId)
    if (errorSelector) {
        let els = document.querySelectorAll(errorSelector)
        els.forEach(el=>el.classList.remove('error'))
    }
    document.querySelector(".alert[data-id='"+id+"']").remove()
}
/* -- FINE ALERT -- */
