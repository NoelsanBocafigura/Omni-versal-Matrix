const navContainer = document.querySelector('.sub-nav');
const displayArea = document.querySelector('.background');
const headerText = document.querySelector('.TopHeader p');

const GIST_URL = "https://gist.githubusercontent.com/NoelsanBocafigura/4dbe0e0f70909435c331a570bd71237c/raw/worlds.json";
const REFRESH_INTERVAL = 30000; 

let myWorlds = [];
let currentWorldData = null; 
let isDatabaseLoaded = false; 

function resetToHub() {
    if (!isDatabaseLoaded) return;
    currentWorldData = null;
    headerText.textContent = "Welcome to the Omni-versal Matrix";
    renderNavigation(); 
    renderWorldGallery();
}

async function initMultiverse(isSilent = false) {
    if (!isSilent) renderLoadingState();
    try {
        const cacheBuster = `?t=${new Date().getTime()}`;
        const response = await fetch(GIST_URL + cacheBuster);
        if (!response.ok) throw new Error(`Sync Failed: ${response.status}`);
        const newData = await response.json();
        
        if (JSON.stringify(newData) !== JSON.stringify(myWorlds)) {
            myWorlds = newData;
            if (currentWorldData) {
                currentWorldData = myWorlds.find(w => w.name === currentWorldData.name);
            }
        }
        isDatabaseLoaded = true; 
        if (!isSilent) resetToHub();
    } catch (error) {
        if (!isSilent) renderErrorMessage(error.message);
    }
}

function renderNavigation() {
    let categories = ['WORLDS'];
    if (currentWorldData) {
        const dataKeys = Object.keys(currentWorldData).filter(key => 
            Array.isArray(currentWorldData[key]) && key !== 'img'
        );
        categories = ['WORLDS', ...dataKeys.map(k => k.toUpperCase())];
    }
    navContainer.innerHTML = categories.map(cat => {
        const isActive = (cat === 'WORLDS' && !currentWorldData) ? 'active' : '';
        return `<div class="nav-items ${isActive}" onclick="handleNavClick(this, '${cat}')">${cat}</div>`;
    }).join('');
}

function handleNavClick(el, category) {
    document.querySelectorAll('.nav-items').forEach(n => n.classList.remove('active'));
    el.classList.add('active');
    if (category === 'WORLDS') resetToHub();
    else renderCategory(category.toLowerCase());
}

function selectWorld(worldName) {
    currentWorldData = myWorlds.find(w => w.name === worldName);
    if (!currentWorldData) return;
    headerText.textContent = `World: ${worldName}`;
    renderNavigation();
    const availableCategories = Object.keys(currentWorldData).filter(k => 
        Array.isArray(currentWorldData[k]) && k !== 'img'
    );
    const firstCat = availableCategories.find(k => currentWorldData[k].length > 0) || availableCategories[0];
    if (firstCat) {
        renderCategory(firstCat);
        const tabs = document.querySelectorAll('.nav-items');
        tabs.forEach(t => t.classList.remove('active'));
        const targetTab = Array.from(tabs).find(t => t.textContent.trim() === firstCat.toUpperCase());
        if (targetTab) targetTab.classList.add('active');
    } else {
        displayArea.innerHTML = `<div class="status-container"><div class="status-text"><h2>EMPTY SECTOR</h2><p>> No data found.</p></div></div>`;
    }
}

function showEntityDetails(category, index) {
    const entity = currentWorldData[category][index];
    const images = Array.isArray(entity.img) ? entity.img : [entity.img || ''];
    const profileImg = images[0];
    const subTag = entity.role || entity.type || entity.classification || category.toUpperCase();
    const subDetail = entity.race || entity.rarity || entity.coordinates || "";

    const formatContent = (val) => {
        if (typeof val === 'string' && val.includes(',')) {
            return val.split(',').map(item => item.trim()).filter(i => i !== "").map(i => `- ${i}`).join('<br>');
        }
        return val;
    };

    const headerKeys = ['name', 'role', 'race', 'img', 'type', 'rarity', 'classification', 'coordinates'];
    let dynamicHTML = '';
    Object.keys(entity).forEach(key => {
        if (!headerKeys.includes(key)) {
            const title = key.replace(/([A-Z])/g, ' $1').toUpperCase();
            const content = entity[key];
            let innerHTML = (typeof content === 'object' && content !== null) ? 
                `<div class="grid-stats">${Object.entries(content).map(([sK, sV]) => `<div><h3>${sK.toUpperCase()}</h3><p>${formatContent(sV)}</p></div>`).join('')}</div>` : 
                `<p>${formatContent(content)}</p>`;
            dynamicHTML += `<details ${key.toLowerCase().includes('desc') || key === 'backstory' ? 'open' : ''}><summary>${title}</summary><div class="details-content">${innerHTML}</div></details>`;
        }
    });

    const modal = document.createElement('div');
    modal.className = 'info-overlay';
    modal.innerHTML = `
        <div class="info-content">
          <button class="close-btn" onclick="this.parentElement.parentElement.remove()">✕ CLOSE SECTOR</button>
          <div class="info-header">
            <div class="info-img" style="background-image: url('${profileImg}')"></div>
            <div class="info-title"><h1>${entity.name}</h1><p class="tag">${subTag} ${subDetail ? '| ' + subDetail : ''}</p></div>
          </div>
          <div class="info-body">
              <div class="visual-database">
                <div class="section-label">> VISUAL_DATABASE_RECORDS</div>
                <div class="horizontal-gallery">${images.map(src => `<div class="gallery-item"><img src="${src}" loading="lazy"></div>`).join('')}</div>
              </div>
              <div class="collapsible-section">${dynamicHTML}</div>
          </div>
        </div>`;
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
    document.body.appendChild(modal);
}

function renderWorldGallery() {
    displayArea.innerHTML = myWorlds.map(world => `
        <div class="card" onclick="selectWorld('${world.name}')">
            <div class="card-img" style="background-image: url('${world.img || ''}'); background-color: #222;"></div>
            <div class="card-overlay">
                <p class="card-role">Cosmology</p>
                <h3 class="card-name">${world.name}</h3>
            </div>
        </div>
    `).join('');
}

function renderCategory(category) {
    if (!currentWorldData || !currentWorldData[category]) return;
    if (currentWorldData[category].length === 0) {
        displayArea.innerHTML = `<div class="status-container"><div class="status-text"><h2>DATA SECTOR EMPTY</h2><p>> No records in ${category}.</p></div></div>`;
        return;
    }
    displayArea.innerHTML = currentWorldData[category].map((item, index) => {
        const thumbImg = Array.isArray(item.img) ? item.img[0] : item.img;
        return `
          <div class="card" onclick="showEntityDetails('${category}', ${index})">
            <div class="card-img" style="background-image: url('${thumbImg || ''}')"></div> 
            <div class="card-overlay">
              <p class="card-role">${item.role || item.type || category.toUpperCase()}</p>
              <h3 class="card-name">${item.name}</h3>
            </div>
          </div>`;
    }).join('');
}

function renderLoadingState() { 
    displayArea.innerHTML = `<div class="status-container"><div class="status-icon"></div><div class="status-text"><h2>SYSTEM: INITIALIZING</h2><p class="status-item">ACCESSING OMNIVERSAL ARCHIVES...</p><p class="status-text">PLEASE STAND BY, TRAVELER...</p></div></div>`; }
function renderErrorMessage(msg) { displayArea.innerHTML = `<div class="status-container"><div class="status-text"><h2 style="color:pink">ERROR: ${msg.toUpperCase()}</h2></div></div>`; }

window.onload = () => { initMultiverse(); setInterval(() => initMultiverse(true), REFRESH_INTERVAL); };