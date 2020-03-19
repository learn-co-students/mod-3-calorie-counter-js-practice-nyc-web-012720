document.addEventListener("DOMContentLoaded", function(){
    form = document.querySelector("#new-calorie-form")
    ul = document.getElementById('calories-list')
    progress = document.getElementsByTagName("progress")[0]
    bmrCalculator = document.querySelector("#bmr-calculator")
    
    fetchAndRenderEntries()
    listenToForm()
    runCaloricTotals()
    listenToUlClicks()
    listenToCalculator()
})

function fetchAndRenderEntries(){
    ul.innerText = ""
    fetch("http://localhost:3000/api/v1/calorie_entries")
    .then(resp => resp.json())
    .then(entries => entries.forEach(entry => renderEntry(entry, ul)))
}

function renderEntry(entry, ul){
    const li = document.createElement('li')
    li.className = "calories-list-item"
    li.dataset.id = entry.id
    li.innerHTML = `
    <div class="uk-grid">
        <div class="uk-width-1-6">
            <strong>${entry.calorie}</strong>
            <span>kcal</span>
        </div>
        <div class="uk-width-4-5">
            <em class="uk-text-meta">${entry.note}</em>
        </div>
    </div>
    <div class="list-item-menu">
        <a class="edit-button" uk-icon="icon: pencil" ></a>
        <a class="delete-button" uk-icon="icon: trash"></a>
    </div>
    `
    ul.append(li)
    runCaloricTotals()
}

function listenToForm(){
    form.addEventListener("submit", event => {
        event.preventDefault()
        console.log(event.target)
        createNewCaloricIntake(event.target)
        form.reset()
    })
}

const createNewCaloricIntake = (formData) => {
    let calorie = formData.getElementsByTagName("input")[0].value
    let note = formData.getElementsByTagName("textarea")[0].value
    console.log(calorie, note)
    
    postObj = {
        method: "POST",
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({calorie, note})
    }
    fetch("http://localhost:3000/api/v1/calorie_entries", postObj)
    .then(response => response.json())
    .then(calorieIntake => {
        renderEntry(calorieIntake, ul)
        runCaloricTotals()
    })
}

const runCaloricTotals = () => {
    fetch("http://localhost:3000/api/v1/calorie_entries")
    .then(response => response.json())
    .then(intakeArray => updateProgressBar(intakeArray.reduce(adder, 0)))
}

const adder = (total, num) => {
    return total + num.calorie
}

const updateProgressBar = (total) => {
    progress.value = total
    console.log(total)
}

const listenToUlClicks = () => {
    ul.addEventListener("click", (event) => {
        if (event.target.dataset.svg === "trash") {
            let calorieLi = event.target.parentNode.parentNode.parentNode
            console.log(calorieLi)
            calorieLi.remove()
            destroyEntry(calorieLi.dataset.id)
        } else if (event.target.dataset.svg === "pencil") {
            let calorieLi = event.target.parentNode.parentNode.parentNode
            let calories = calorieLi.getElementsByTagName("strong")[0].innerText
            let description = calorieLi.getElementsByTagName("em")[0].innerText
            console.log(calories, description)
            const modal = document.querySelector("#edit-form-container")
            modal.getElementsByTagName("input")[0].value = calories
            modal.getElementsByTagName("textarea")[0].value = description
            modal.dataset.id = calorieLi.dataset.id
            UIkit.modal(modal).show()
            modalFormListener()
        }
    })
}

const destroyEntry = (entryId) => {
    fetch(`http://localhost:3000/api/v1/calorie_entries/${entryId}`, {
        method: 'Delete'
    })
    .then(data => {
        runCaloricTotals()
    })
}

const listenToCalculator = () => {
    bmrCalculator.addEventListener("submit", event => {
        event.preventDefault()
        let formResults = {
            weight: event.target.children[1].children[0].value,
            height: event.target.children[2].children[0].value,
            age: event.target.children[3].children[0].value
        }
        let lowerRange = document.querySelector("span#lower-bmr-range ")
        let higherRange = document.querySelector("span#higher-bmr-range ")
        lowerRange.innerText = calculateLowerBMR(formResults)
        higherRange.innerText = calculateHigherBMR(formResults)
        let average = parseInt((calculateLowerBMR(formResults) + calculateHigherBMR(formResults))/2)
        bmrCalculator.reset()

        progress.max = (average)
    })
}

const calculateLowerBMR = formResults => {
    return parseInt((655 + (4.35*formResults.weight) + (4.7*formResults.height) - (4.7*formResults.age)))
}

const calculateHigherBMR = formResults => {
    return parseInt((66 + (6.23*formResults.weight) + (12.7*formResults.height) - (6.8*formResults.age)))
}

const modalFormListener = () => {
    const modalForm = document.getElementById("edit-calorie-form")
    modalForm.addEventListener("submit", event => {
        event.preventDefault()
        modalPatch(event.target)
    })
}

const modalPatch = (formInfo) => {
    const calorie = formInfo.getElementsByTagName("input")[0].value
    const note = formInfo.getElementsByTagName("textarea")[0].value
    const id = formInfo.parentNode.parentNode.dataset.id
    fetch(`http://localhost:3000/api/v1/calorie_entries/${id}`, {
        method: "PATCH",
        headers: {
            'Content-Type': 'application/json',
            'accept': 'application/json'
        },
        body: JSON.stringify({calorie, note})
    })
    .then(response => response.json())
    .then(singleEntry => {
        const modal = document.querySelector("#edit-form-container")
        UIkit.modal(modal).hide()
        fetchAndRenderEntries()
    })
    console.log(id, calorie, note)
}


// When clicking the pencil icon, a modal will appear.
    // This modal should contain a form pre-populated with the information 
    // from the respective calorie-entry.
    // clicking anywhere outside the modal will cause the modal to disappear.
    // clicking the 'Save Changes' button in the modal form will update that entry 
    // on the front-end as well as the backend, we would like this to happen pessimistically.