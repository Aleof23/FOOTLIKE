// --- ESTADO GLOBAL DEL JUEGO ---
const SAVE_KEY = 'football_roguelike_save';
const HISTORY_KEY = 'football_roguelike_history'; 

const defaultState = {
    playerName: "Jugador",
    playerNumber: 10,
    playerPosition: "DC",
    age: 18,
    season: 1,
    team: "Agente Libre",
    league: "Ninguna",
    rating: 60, 
    potential: 85,
    goals: 0,
    assists: 0,
    matches: 0,
    matchesThisSeason: 0,
    goalsThisSeason: 0,
    assistsThisSeason: 0,
    trophies: 0,
    ballonsDor: 0,       
    goldenBoots: 0,      
    titlesList: [],      
    teamsPlayed: [],
    currentTier: 0, 
    currentNodeId: null, 
    seasonTree: [],
    finalsReached: [], 
    currentFinalIndex: 0, 
    simMode: 1,
    seasonsAtCurrentClub: 0, 
    upgradedClubs: {},
    visitedNodes: [],
    titlesThisSeason: 0,
    transfersThisSeason: []
};

let gameState = {};

const IMAGE_FOLDER = "graphics"; 
const IMAGE_EXT = ".png";        

const DOM = {
    startScreen: document.getElementById('start-screen'),
    startMenu: document.getElementById('start-menu'),
    btnContinue: document.getElementById('btn-continue'),
    btnNewCareer: document.getElementById('btn-new-career'),
    btnPastCareers: document.getElementById('btn-past-careers'), 
    
    newCareerForm: document.getElementById('new-career-form'),
    inputName: document.getElementById('input-name'),
    inputNumber: document.getElementById('input-number'),
    inputPosition: document.getElementById('input-position'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnBackMenu: document.getElementById('btn-back-menu'),
    
    pastCareersScreen: document.getElementById('past-careers-screen'), 
    pastCareersList: document.getElementById('past-careers-list'),     
    btnBackFromHistory: document.getElementById('btn-back-from-history'), 

    gameUI: document.getElementById('game-ui'),
    statName: document.getElementById('stat-name'),
    statPosition: document.getElementById('stat-position'),
    statNumber: document.getElementById('stat-number'),
    age: document.getElementById('stat-age'),
    team: document.getElementById('stat-team'),
    season: document.getElementById('stat-season'),
    rating: document.getElementById('stat-rating'),
    goals: document.getElementById('stat-goals'),
    assists: document.getElementById('stat-assists'),
    matches: document.getElementById('stat-matches'),
    trophies: document.getElementById('stat-trophies'),
    ballon: document.getElementById('stat-ballon'),
    boot: document.getElementById('stat-boot'),
    
    btnReset: document.getElementById('btn-reset'),
    btnRetire: document.getElementById('btn-retire'),
    btnToggleSim: document.getElementById('btn-toggle-sim'),
    
    nodesWrapper: document.getElementById('nodes-wrapper'),
    treeLines: document.getElementById('tree-lines'),
    logList: document.getElementById('log-list'),
    modalOverlay: document.getElementById('event-modal'),
    modalTitle: document.getElementById('modal-title'),
    modalDynamic: document.getElementById('modal-dynamic-content'),
    modalDesc: document.getElementById('modal-desc'),
    modalChoices: document.getElementById('modal-choices'),

    liveMatchModal: document.getElementById('live-match-modal'),
    liveTeam1Logo: document.getElementById('live-team1-logo'),
    liveTeam1Name: document.getElementById('live-team1-name'),
    liveTeam2Logo: document.getElementById('live-team2-logo'),
    liveTeam2Name: document.getElementById('live-team2-name'),
    liveTime: document.getElementById('live-match-time'),
    liveScore1: document.getElementById('live-score1'),
    liveScore2: document.getElementById('live-score2'),
    liveEvents: document.getElementById('live-match-events'),
    liveChoices: document.getElementById('live-match-choices'),
    btnSkipMatch: document.getElementById('btn-skip-match'),

    retirementScreen: document.getElementById('retirement-screen'),
    retirementSummary: document.getElementById('retirement-summary'),
    btnBackToMain: document.getElementById('btn-back-to-main'),

    // Botones para el menú móvil
    btnToggleStats: document.getElementById('btn-toggle-stats'),
    btnToggleLog: document.getElementById('btn-toggle-log')
};

const EVENT_ICONS = {
    transfer: "🤝", match: "⚽", training: "🏋️", final_match: "🏆",
    season_summary: "📊", rest: "🛋️", random: "❓"
};

function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getMarketValue() {
    let grl = gameState.rating;
    let age = gameState.age;
    let base = 0.5; 
    
    if (grl < 60) base = 0.5 + (grl - 50) * 0.1; 
    else if (grl < 70) base = 1.5 + (grl - 60) * 0.5; 
    else if (grl < 80) base = 6.5 + (grl - 70) * 2; 
    else if (grl < 90) base = 26.5 + (grl - 80) * 5; 
    else base = 76.5 + (grl - 90) * 10; 
    
    let ageMult = 1;
    if (age <= 21) ageMult = 1.5;
    else if (age <= 24) ageMult = 1.2;
    else if (age >= 30 && age < 34) ageMult = Math.max(0.4, 1 - ((age - 29) * 0.15)); 
    else if (age >= 34) ageMult = 0.3; 
    
    return base * ageMult;
}

function formatMoney(m) {
    if (m < 1) return (m * 1000).toFixed(0) + "K €";
    return m.toFixed(1) + "M €";
}

function getEffectiveTier(teamName) {
    let teamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === teamName) : null;
    if (!teamInfo) return 4;
    let upgrades = (gameState.upgradedClubs && gameState.upgradedClubs[teamName]) ? gameState.upgradedClubs[teamName] : 0;
    return Math.max(1, teamInfo.tier - upgrades); 
}

function getShieldHtml(teamId, size = "50px", isInline = false) {
    if (!teamId || teamId === "default") {
        return `<div style="width:${size}; height:${size}; display:${isInline ? 'inline-flex' : 'flex'}; justify-content:center; align-items:center; background:var(--border-color); border-radius:50%; margin-${isInline ? 'right' : 'bottom'}:8px; font-size:${parseInt(size)/2}px;">👤</div>`;
    }
    return `<img src="${IMAGE_FOLDER}/${teamId}${IMAGE_EXT}" alt="${teamId}" style="width:${size}; height:${size}; object-fit:contain; ${isInline ? 'vertical-align:middle; margin-right:8px;' : 'margin-bottom:8px;'}">`;
}

// --- INICIALIZACIÓN ---
function init() {
    DOM.btnNewCareer.addEventListener('click', () => { DOM.startMenu.classList.add('hidden'); DOM.newCareerForm.classList.remove('hidden'); });
    DOM.btnBackMenu.addEventListener('click', () => { DOM.newCareerForm.classList.add('hidden'); DOM.startMenu.classList.remove('hidden'); });
    DOM.btnPastCareers.addEventListener('click', showPastCareers);
    DOM.btnBackFromHistory.addEventListener('click', () => { DOM.pastCareersScreen.classList.add('hidden'); DOM.startMenu.classList.remove('hidden'); });
    
    DOM.btnStartGame.addEventListener('click', startNewCareer);
    DOM.btnContinue.addEventListener('click', continueCareer);
    DOM.btnReset.addEventListener('click', resetGame);
    DOM.btnRetire.addEventListener('click', confirmRetirement);
    DOM.btnBackToMain.addEventListener('click', () => location.reload());
    DOM.btnToggleSim.addEventListener('click', toggleSimMode);

    // --- ARREGLO MENÚ MÓVIL ---
    if (DOM.btnToggleStats) {
        DOM.btnToggleStats.addEventListener('click', () => {
            document.querySelector('.left-panel').classList.add('mobile-visible');
            document.querySelector('.right-panel').classList.remove('mobile-visible');
        });
    }
    if (DOM.btnToggleLog) {
        DOM.btnToggleLog.addEventListener('click', () => {
            document.querySelector('.right-panel').classList.add('mobile-visible');
            document.querySelector('.left-panel').classList.remove('mobile-visible');
        });
    }

    // Inyección de botones de "Cerrar" solo para el móvil
    const leftPanel = document.querySelector('.left-panel');
    const rightPanel = document.querySelector('.right-panel');
    
    if(leftPanel && !document.getElementById('close-left')) {
        let btnCloseL = document.createElement('button');
        btnCloseL.id = 'close-left';
        btnCloseL.className = 'close-mobile-btn';
        btnCloseL.innerHTML = '❌ Cerrar Panel';
        btnCloseL.onclick = () => leftPanel.classList.remove('mobile-visible');
        leftPanel.insertBefore(btnCloseL, leftPanel.firstChild);
    }
    
    if(rightPanel && !document.getElementById('close-right')) {
        let btnCloseR = document.createElement('button');
        btnCloseR.id = 'close-right';
        btnCloseR.className = 'close-mobile-btn';
        btnCloseR.innerHTML = '❌ Cerrar Panel';
        btnCloseR.onclick = () => rightPanel.classList.remove('mobile-visible');
        rightPanel.insertBefore(btnCloseR, rightPanel.firstChild);
    }

    // --- LÓGICA DEL MODO CLARO/OSCURO ---
    const btnTheme = document.getElementById('btn-theme-toggle');
    if (btnTheme) {
        btnTheme.addEventListener('click', () => {
            document.body.classList.toggle('light-theme');
            // Guardamos tu preferencia para la próxima vez
            localStorage.setItem('futlike_theme', document.body.classList.contains('light-theme') ? 'light' : 'dark');
        });
    }
    
    // Al entrar al juego, mira si lo habías dejado en modo claro
    if (localStorage.getItem('futlike_theme') === 'light') {
        document.body.classList.add('light-theme');
    }

    window.addEventListener('resize', drawLines);
    if (localStorage.getItem(SAVE_KEY)) DOM.btnContinue.classList.remove('hidden');
    
}

function startNewCareer() {
    let pRoll = Math.random() * 100;
    let pot = 85;
    if (pRoll < 40) pot = randomInt(80, 84);
    else if (pRoll < 75) pot = randomInt(85, 89);
    else if (pRoll < 95) pot = randomInt(90, 94);
    else pot = randomInt(95, 99); 

    gameState = { ...defaultState, 
        playerName: DOM.inputName.value.trim() || "Promesa Anónima",
        playerNumber: DOM.inputNumber.value || 10,
        playerPosition: DOM.inputPosition.value,
        rating: randomInt(50, 70), 
        potential: pot,
        teamsPlayed: [], seasonTree: [], upgradedClubs: {}, finalsReached: [], titlesList: [],
        visitedNodes: [], titlesThisSeason: 0, transfersThisSeason: []
    };
    generateDiamondTree();
    saveState();
    startGameUI();
    addLog(`¡Bienvenido al fútbol profesional, ${gameState.playerName}! Inicias como ${gameState.playerPosition} con ${gameState.rating} GRL.`, "system");
}

function continueCareer() {
    gameState = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (gameState.simMode === undefined) gameState.simMode = 1; 
    if (gameState.seasonsAtCurrentClub === undefined) gameState.seasonsAtCurrentClub = 0;
    if (gameState.upgradedClubs === undefined) gameState.upgradedClubs = {};
    if (gameState.finalsReached === undefined) gameState.finalsReached = [];
    if (gameState.currentFinalIndex === undefined) gameState.currentFinalIndex = 0;
    if (gameState.ballonsDor === undefined) gameState.ballonsDor = 0;
    if (gameState.goldenBoots === undefined) gameState.goldenBoots = 0;
    if (gameState.titlesList === undefined) gameState.titlesList = [];
    if (gameState.visitedNodes === undefined) gameState.visitedNodes = [];
    if (gameState.titlesThisSeason === undefined) gameState.titlesThisSeason = 0;
    if (gameState.transfersThisSeason === undefined) gameState.transfersThisSeason = [];
    if (gameState.potential === undefined) gameState.potential = randomInt(85, 95);
    
    startGameUI();
    addLog("Partida cargada correctamente.", "system");
}

function startGameUI() {
    DOM.startScreen.classList.add('hidden');
    DOM.gameUI.classList.remove('hidden');
    updateSimBtnText();
    updateUI();
    renderTree();
}

function saveState() { localStorage.setItem(SAVE_KEY, JSON.stringify(gameState)); }

function resetGame() {
    if (confirm("¿Seguro que quieres abandonar tu carrera? No se guardará en el Salón de la Fama.")) {
        localStorage.removeItem(SAVE_KEY);
        location.reload();
    }
}

function toggleSimMode() {
    gameState.simMode = (gameState.simMode + 1) % 3;
    updateSimBtnText();
    saveState();
}

function updateSimBtnText() {
    if (gameState.simMode === 0) DOM.btnToggleSim.innerHTML = "⚡ DESACTIVADA";
    else if (gameState.simMode === 1) DOM.btnToggleSim.innerHTML = "⏱️ SOLO FINALES";
    else DOM.btnToggleSim.innerHTML = "⏱️ COMPLETA";
}

function calculateCareerScore() {
    let g = gameState.goals; let a = gameState.assists; let bo = gameState.ballonsDor || 0;
    let championsCount = 0; let otherTitlesCount = 0;
    if (gameState.titlesList) {
        gameState.titlesList.forEach(t => {
            if (t.toLowerCase().includes("champions")) championsCount++; else otherTitlesCount++;
        });
    }

    let G_score = 10 * (1 - Math.exp(-g / 250));
    let A_score = 10 * (1 - Math.exp(-a / 150));
    let BO_score = 10 * (1 - Math.exp(-bo / 1.5));
    let MC_score = 10 * (1 - Math.exp(-championsCount / 2));
    let TC_score = 10 * (1 - Math.exp(-otherTitlesCount / 5));

    let numClubs = gameState.teamsPlayed.length || 1;
    let CL_score = Math.max(0, 10 - Math.abs(numClubs - 4) * 2);

    let finalScore = 0; let pos = gameState.playerPosition;
    if (pos === "DC" || pos === "EXT") finalScore = (G_score * 0.35) + (BO_score * 0.20) + (MC_score * 0.15) + (A_score * 0.12) + (TC_score * 0.10) + (CL_score * 0.08);
    else if (pos === "MC") finalScore = (BO_score * 0.25) + (A_score * 0.25) + (MC_score * 0.18) + (G_score * 0.12) + (TC_score * 0.12) + (CL_score * 0.08);
    else if (pos === "DEF") finalScore = (BO_score * 0.25) + (MC_score * 0.25) + (G_score * 0.15) + (A_score * 0.10) + (TC_score * 0.17) + (CL_score * 0.08);

    return Math.max(1, Math.min(10, finalScore)).toFixed(2);
}

// --- FUNCIONES DEL SALÓN DE LA FAMA ---
function showPastCareers() {
    DOM.startMenu.classList.add('hidden');
    DOM.pastCareersScreen.classList.remove('hidden');
    renderPastCareers();
}

function renderPastCareers() {
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    DOM.pastCareersList.innerHTML = '';
    
    if (history.length === 0) { 
        DOM.pastCareersList.innerHTML = '<p style="color:var(--text-muted);">Aún no hay leyendas registradas.</p>'; 
        return; 
    }

    history.forEach((c, index) => {
        let div = document.createElement('div'); 
        div.className = 'history-card';
        div.innerHTML = `
            <div style="flex:1;">
                <h4 style="color:var(--text-light); margin-bottom:5px;">${c.name} (${c.position})</h4>
                <p style="font-size:0.85rem; color:var(--text-muted);">Goles: ${c.goals} | Asistencias: ${c.assists} <br>🏆 Títulos: ${c.titles} | 🌕 Balones: ${c.ballons}</p>
            </div>
            <div style="display:flex; align-items:center; gap: 15px;">
                <div class="history-card-score">${c.score}</div>
                <button class="delete-history-btn" onclick="deletePastCareer(${index})" title="Borrar leyenda">❌</button>
            </div>
        `;
        DOM.pastCareersList.appendChild(div);
    });
}

function deletePastCareer(index) {
    if (confirm("¿Estás seguro de que quieres borrar esta leyenda del Salón de la Fama? Esta acción no se puede deshacer.")) {
        let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
        history.splice(index, 1);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
        renderPastCareers(); 
    }
}

function confirmRetirement() {
    if (confirm("¿Estás seguro de que quieres colgar las botas? Esto finalizará tu carrera para siempre y calculará tu nota final.")) retirePlayer();
}

function retirePlayer() {
    DOM.gameUI.classList.add('hidden');
    DOM.retirementScreen.classList.remove('hidden');

    let finalScore = calculateCareerScore();
    let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
    history.push({ name: gameState.playerName, position: gameState.playerPosition, score: finalScore, goals: gameState.goals, assists: gameState.assists, ballons: gameState.ballonsDor || 0, titles: gameState.trophies });
    history.sort((a, b) => parseFloat(b.score) - parseFloat(a.score));
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));

    let clubsHtml = gameState.teamsPlayed.map(tName => { let tInfo = TEAMS_DB.find(t => t.name === tName); return getShieldHtml(tInfo ? tInfo.id : "default", "45px", true); }).join("") || "<span style='color:var(--text-muted)'>Ninguno</span>";
    let titlesHtml = "";
    if (gameState.titlesList && gameState.titlesList.length > 0) {
        let counts = {}; gameState.titlesList.forEach(t => counts[t] = (counts[t] || 0) + 1);
        for (let [title, count] of Object.entries(counts)) { titlesHtml += `<span style="display:inline-block; background:rgba(251,191,36,0.15); color:var(--gold-star); padding:6px 10px; border-radius:6px; margin:4px; font-size:0.95rem; border:1px solid var(--gold-star);">🏆 ${title} x${count}</span>`; }
    } else titlesHtml = "<span style='color:var(--text-muted)'>No levantaste ningún título.</span>";

    DOM.retirementSummary.innerHTML = `
        <div class="retirement-stats-grid">
            <div class="retire-box" style="grid-column: span 2; border-color: #fbbf24; box-shadow: 0 0 20px rgba(251, 191, 36, 0.4);">
                <h4 style="color: #fbbf24;">NOTA GLOBAL DE CARRERA</h4><span style="font-size: 4rem;">${finalScore} <span style="font-size:1.5rem; color:var(--text-muted)">/ 10</span></span>
            </div>
            <div class="retire-box"><h4>Partidos</h4><span>${gameState.matches}</span></div><div class="retire-box"><h4>Goles</h4><span>${gameState.goals}</span></div>
            <div class="retire-box"><h4>Asistencias</h4><span>${gameState.assists}</span></div><div class="retire-box"><h4>Trofeos</h4><span>${gameState.trophies}</span></div>
            <div class="retire-box" style="border-color: #fbbf24;"><h4 style="color: #fbbf24;">Balones de Oro 🌕</h4><span>${gameState.ballonsDor || 0}</span></div>
            <div class="retire-box" style="border-color: #fbbf24;"><h4 style="color: #fbbf24;">Botas de Oro 👟</h4><span>${gameState.goldenBoots || 0}</span></div>
            <div class="retire-clubs" style="grid-column: span 2;"><h4>Palmarés (Títulos)</h4><div style="display:flex; flex-wrap:wrap; gap:5px; margin-top:10px;">${titlesHtml}</div></div>
            <div class="retire-clubs" style="grid-column: span 2;"><h4>Clubes Representados</h4><div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">${clubsHtml}</div></div>
        </div>
    `;
    localStorage.removeItem(SAVE_KEY); 
}

function updateUI() {
    if (!document.getElementById('stat-ballon')) {
        let statContainer = document.querySelector('.stats-container');
        if (statContainer) {
            let newGroup = document.createElement('div'); newGroup.className = 'stat-group';
            newGroup.innerHTML = `<p><strong>Balones Oro:</strong> <span id="stat-ballon">0</span> 🌕</p><p><strong>Botas Oro:</strong> <span id="stat-boot">0</span> 👟</p>`;
            let toggleGroup = document.getElementById('btn-toggle-sim').parentElement;
            statContainer.insertBefore(newGroup, toggleGroup);
            DOM.ballon = document.getElementById('stat-ballon'); DOM.boot = document.getElementById('stat-boot');
        }
    }

    DOM.statName.textContent = gameState.playerName;
    DOM.statPosition.textContent = gameState.playerPosition;
    DOM.statNumber.textContent = gameState.playerNumber;
    DOM.age.textContent = gameState.age;
    DOM.team.textContent = gameState.team;
    DOM.season.textContent = gameState.season;
    
    let displayRating = Math.round(gameState.rating * 10) / 10;
    DOM.rating.textContent = displayRating % 1 === 0 ? displayRating : displayRating.toFixed(1);
    
    DOM.goals.textContent = gameState.goals;
    DOM.assists.textContent = gameState.assists;
    DOM.matches.textContent = gameState.matches;
    DOM.trophies.textContent = gameState.trophies;

    if (DOM.ballon) DOM.ballon.textContent = gameState.ballonsDor || 0;
    if (DOM.boot) DOM.boot.textContent = gameState.goldenBoots || 0;
}

function addLog(msg, type = "normal") {
    const li = document.createElement('li'); li.textContent = `[T${gameState.season}] ${msg}`; li.className = `log-entry ${type}`;
    DOM.logList.prepend(li);
}

function openModal(title, desc) {
    DOM.modalTitle.textContent = title; DOM.modalDesc.innerHTML = desc; DOM.modalDynamic.innerHTML = ''; DOM.modalChoices.innerHTML = ''; DOM.modalOverlay.classList.remove('hidden');
}

function addChoice(html, action, isDanger = false) {
    const btn = document.createElement('button'); btn.className = `choice-btn ${isDanger ? 'danger' : ''}`; btn.innerHTML = html;
    btn.addEventListener('click', action); DOM.modalChoices.appendChild(btn);
}

function showModalResult(title, dynamicHtml, descHtml, continueCallback) {
    DOM.modalTitle.textContent = title; DOM.modalDynamic.innerHTML = dynamicHtml; DOM.modalDesc.innerHTML = descHtml; DOM.modalChoices.innerHTML = '';
    addChoice("Continuar", continueCallback); DOM.modalOverlay.classList.remove('hidden');
}

function getInjuryMultiplier() {
    if (gameState.age >= 40) return 3;      
    if (gameState.age >= 34) return 2;      
    if (gameState.age >= 31) return 1.5;    
    if (gameState.age >= 28) return 1.25;   
    return 1;                               
}

function silentlySimulateRemainingFinals() {
    if (!gameState.finalsReached || gameState.finalsReached.length === 0) return;
    
    while (gameState.currentFinalIndex < gameState.finalsReached.length) {
        let finalName = gameState.finalsReached[gameState.currentFinalIndex];
        gameState.currentFinalIndex++;
        
        let myTier = getEffectiveTier(gameState.team);
        let rivalTier = randomInt(1, 2);
        let myGoals = randomInt(0, 2);
        let rivGoals = randomInt(0, 2);
        
        let tierDiff = rivalTier - myTier;
        if (tierDiff > 0) myGoals += randomInt(0, tierDiff);
        else if (tierDiff < 0) rivGoals += randomInt(0, Math.abs(tierDiff) * 2);
        
        let won = (myGoals > rivGoals) || (myGoals === rivGoals && Math.random() > 0.5);
        if (won) {
            gameState.trophies++;
            if (!gameState.titlesList) gameState.titlesList = [];
            gameState.titlesList.push(`${finalName} (${gameState.team})`);
            gameState.titlesThisSeason = (gameState.titlesThisSeason || 0) + 1;
            addLog(`[Simulado] Tu equipo GANÓ la final de ${finalName} sin ti (${myGoals}-${rivGoals}). ¡Campeones!`, "system");
        } else {
            addLog(`[Simulado] Tu equipo perdió la final de ${finalName} (${myGoals}-${rivGoals}) por tu ausencia.`, "injury");
        }
    }
}

function applyInjury(sourceContext) {
    const injuries = [
        { name: "Rotura de Ligamento Cruzado", skip: 99, penalty: 8, weight: 5 },
        { name: "Esguince Grave", skip: 3, penalty: 5, weight: 20 },            
        { name: "Lesión en el Gemelo", skip: 2, penalty: 3, weight: 35 },         
        { name: "Molestias en el Cuádriceps", skip: 1, penalty: 2, weight: 40 }   
    ];
    
    let roll = Math.random() * 100;
    let sum = 0;
    let injury = injuries[0];
    
    for (let inj of injuries) {
        sum += inj.weight;
        if (roll <= sum) {
            injury = inj;
            break;
        }
    }
    
    gameState.rating -= injury.penalty;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    let displayRating = Math.round(gameState.rating * 10) / 10;
    
    addLog(`¡TERRIBLE! Te has lesionado: ${injury.name}. Has perdido ${injury.penalty} GRL.`, "injury");
    
    let dynamicHtml = `<div style="font-size:4rem">🚑</div>`;
    let descHtml = `Has sufrido una <strong>${injury.name}</strong> durante el ${sourceContext}. <br><br><strong style="color:var(--danger-red);">Repercusión médica: -${injury.penalty} GRL</strong><br>Tu media ha bajado a: ${displayRating}.`;
    
    if (injury.skip === 99) descHtml += "<br><br>Te pierdes el resto de la temporada por completo. Se acabó el año para ti...";
    else descHtml += `<br><br>Estarás de baja de forma obligatoria y te perderás los próximos ${injury.skip} eventos del calendario.`;
    
    showModalResult("¡LESIÓN GRAVE!", dynamicHtml, descHtml, () => {
        let newTier = gameState.currentTier + injury.skip + 1;
        
        // ACTUALIZADO: Si la lesión salta el Tier 7, simular finales en secreto
        if (injury.skip === 99 || newTier > 7) silentlySimulateRemainingFinals();
        
        if (injury.skip === 99) {
            DOM.modalOverlay.classList.add('hidden');
            endSeason();
        } else {
            gameState.currentTier = newTier; 
            if (gameState.currentTier >= gameState.seasonTree.length) resolveSeasonSummary(); 
            else { DOM.modalOverlay.classList.add('hidden'); saveState(); updateUI(); renderTree(); }
        }
    });
}

function getOfferTier(rating) {
    let r = Math.random() * 100;
    if (rating >= 85) { if (r < 80) return 1; if (r < 95) return 2; if (r < 99) return 3; return 4; } 
    else if (rating >= 75) { if (r < 12) return 1; if (r < 82) return 2; if (r < 96) return 3; return 4; } 
    else if (rating >= 65) { if (r < 4) return 1; if (r < 17) return 2; if (r < 80) return 3; return 4; } 
    else { return 4; }
}

function openActionPanel(node) {
    gameState.currentNodeId = node.id; 
    
    if (!gameState.visitedNodes) gameState.visitedNodes = [];
    gameState.visitedNodes.push(node.id);

    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTeamId = myTeamInfo ? myTeamInfo.id : "default";

    // --- 1. EVENTO DE MERCADO DE FICHAJES (NUEVAS CARTAS) ---
    if (node.type === 'transfer') {
        let marketVal = getMarketValue();
        
        let offerCountRoll = Math.random() * 100;
        let numOffers = 0;
        if (offerCountRoll < 5) numOffers = 0;        
        else if (offerCountRoll < 30) numOffers = 1; 
        else if (offerCountRoll < 70) numOffers = 2; 
        else if (offerCountRoll < 95) numOffers = 3; 
        else numOffers = randomInt(4, 5);            
        
        let offers = [];
        for(let i=0; i<numOffers; i++) {
            let targetTier = getOfferTier(gameState.rating);
            let possibleTeams = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => getEffectiveTier(t.name) === targetTier && t.name !== gameState.team) : [];
            if(possibleTeams.length > 0) {
                let randomTeam = possibleTeams[Math.floor(Math.random() * possibleTeams.length)];
                if(!offers.some(o => o.name === randomTeam.name)) offers.push(randomTeam);
            }
        }

        let offerData = offers.map(o => { return { ...o, fee: marketVal * ((Math.random() * 0.4) + 0.8) }; });

        let isFired = false;
        let firedMsg = "";
        if (gameState.team !== "Agente Libre") {
            if (Math.random() < 0.15) { 
                isFired = true;
                firedMsg = `<br><br><span style="color:var(--danger-red);"><strong>¡ATENCIÓN!</strong> El ${gameState.team} ha decidido no renovar tu contrato. Te han enseñado la puerta de salida.</span>`;
            }
        }

        DOM.modalOverlay.classList.remove('hidden'); 
        DOM.modalTitle.textContent = "Mercado de Fichajes";
        DOM.modalDesc.innerHTML = ""; 
        DOM.modalChoices.innerHTML = ""; 

        // Inyectamos el texto descriptivo ARRIBA del todo
        DOM.modalDynamic.innerHTML = `
            <div style="width: 100%; margin-bottom: 2rem; text-align: center; font-size: 1.1rem; color: var(--text-light); line-height: 1.5;">
                Tu agente te trae ofertas basadas en tu rendimiento actual.<br><br>
                <span style="color:var(--text-muted); font-size:0.95rem;">📊 Tu Valor de Mercado aprox: <strong style="color:var(--action-cyan)">${formatMoney(marketVal)}</strong></span>
                ${firedMsg}
            </div>
        `;

        // Contenedor principal horizontal para las cartas
        const offersList = document.createElement('div');
        offersList.className = 'offers-list-container';
        DOM.modalDynamic.appendChild(offersList);

        function createOfferCard(offer, specialType = '') {
            const card = document.createElement('div');
            card.className = `offer-card ${specialType}`;
            
            const shieldHtml = getShieldHtml(offer.id, "60px", false); 
            const moneyHtml = specialType === 'stay' ? '' : `<div class="card-money-label">Oferta:</div><div class="card-money">${formatMoney(offer.fee)}</div>`;
            const titleHtml = specialType === 'stay' ? `<div class="card-title" style="color:var(--text-muted)">QUEDARME</div>` : `<div class="card-title">${offer.name}</div>`;
            
            card.innerHTML = `
                ${titleHtml}
                <div class="card-crest large">${shieldHtml}</div>
                ${moneyHtml}
            `;

            if (specialType === 'stay') {
                card.addEventListener('click', () => stayAtClub());
            } else {
                card.addEventListener('click', () => acceptOffer(offer));
            }

            offersList.appendChild(card);
        }

        if (gameState.team === "Agente Libre" || isFired) {
             if (offerData.length === 0) {
                let fallback = typeof TEAMS_DB !== 'undefined' ? { ...TEAMS_DB[Math.floor(Math.random() * TEAMS_DB.length)] } : { id: 'default', name: 'FC Equipo Local', league: 'Liga' };
                fallback.fee = marketVal * ((Math.random() * 0.4) + 0.8);
                createOfferCard(fallback, isFired ? 'fired' : 'fallback'); 
             } else {
                offerData.forEach(offer => createOfferCard(offer, isFired ? 'fired' : 'fallback'));
             }
        } else {
            if (offerData.length > 0) offerData.forEach(offer => createOfferCard(offer, ''));
            createOfferCard({ id: myTeamId, name: gameState.team, fee: 0 }, 'stay');
        }

    // --- 2. RESTO DE EVENTOS (PARTIDOS, ENTRENOS...) QUE SE HABÍAN BORRADO ---
    } else if (node.type === 'training') {
        openModal("Día de Entrenamiento", "Entrenamiento táctico y físico con el equipo.");
        addChoice("Machacarse en el gimnasio", () => resolveTraining());
    } else if (node.type === 'rest') {
        openModal("Día Libre", "El calendario te da un respiro. Tienes el día para ti.");
        addChoice("Desconectar y relajarse", () => resolveRest());
    } else if (node.type === 'random') {
        openModal("Evento Inesperado", "La vida del futbolista está llena de sorpresas fuera del campo...");
        addChoice("Ver qué sucede", () => resolveRandomEvent());
    } else if (node.type === 'match') {
        openModal("Día de Partido", "Partido importante en el calendario de la liga.");
        addChoice("Saltar al campo", () => resolveMatch(false));
    } else if (node.type === 'final_match') {
        let currentFinal = gameState.finalsReached[gameState.currentFinalIndex];
        openModal(`¡GRAN FINAL DE ${currentFinal.toUpperCase()}!`, "Ha llegado el día más importante de la temporada. Todo o nada.");
        addChoice("Dar la vida en el campo", () => resolveMatch(true));
    } else if (node.type === 'season_summary') {
        openModal("Fin de Temporada", "La temporada ha concluido. Es hora de hacer balance de tu rendimiento anual.");
        addChoice("Ver Resumen de Temporada", () => resolveSeasonSummary());
    }
}

function recalculateFinals() {
    gameState.finalsReached = [];
    gameState.currentFinalIndex = 0;

    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTier = getEffectiveTier(gameState.team);

    let pCup = 0, pLeague = 0, pEurope = 0;
    if (myTier === 4) { pCup = 10; pLeague = 1; }
    else if (myTier === 3) { pCup = 20; pLeague = 5; }
    else if (myTier === 2) { pCup = 35; pLeague = 10; pEurope = 35; }
    else if (myTier === 1) { pCup = 40; pLeague = 70; pEurope = 40; }

    let myEuro = myTeamInfo ? myTeamInfo.europeanCompetition : null;
    if (myTier <= 2 && !myEuro) myEuro = myTier === 1 ? "Champions League" : "Europa League";

    if (Math.random() * 100 < pLeague) gameState.finalsReached.push("Liga");
    if (Math.random() * 100 < pCup) gameState.finalsReached.push("Copa");
    if (myEuro && (Math.random() * 100 < pEurope)) gameState.finalsReached.push(myEuro);

    let hasFinals = gameState.finalsReached.length > 0;

    // ACTUALIZADO: Ahora las finales están en el Tier 7
    if (gameState.seasonTree && gameState.seasonTree[7]) {
        gameState.seasonTree[7].forEach(node => {
            if (gameState.currentTier < 7) {
                node.type = hasFinals ? 'final_match' : getRandomEventType();
            }
        });
    }
}

function acceptOffer(teamObj) {
    gameState.team = teamObj.name;
    gameState.league = teamObj.league;
    gameState.seasonsAtCurrentClub = 0; 
    
    if (!gameState.transfersThisSeason) gameState.transfersThisSeason = [];
    gameState.transfersThisSeason.push({ team: teamObj.name, fee: teamObj.fee });

    if (!gameState.teamsPlayed.includes(teamObj.name)) gameState.teamsPlayed.push(teamObj.name);

    addLog(`Fichas por el ${teamObj.name} (${formatMoney(teamObj.fee)}).`, "system");
    
    recalculateFinals();

    let logoHtml = `<img src="${IMAGE_FOLDER}/${teamObj.id}${IMAGE_EXT}" alt="${teamObj.name}" style="height:100px; object-fit:contain;" onerror="this.style.display='none'">`;
    showModalResult("Fichaje Cerrado", logoHtml, `Bienvenido a tu nuevo hogar: ${teamObj.name}.<br><br>Costo de tu traspaso: <strong style="color:var(--grass-green)">${formatMoney(teamObj.fee)}</strong>.`, advanceNode);
}

function stayAtClub() {
    addLog(`Renuevas tu lealtad con el ${gameState.team}.`);
    showModalResult("Contrato Extendido", `<div style="font-size:4rem">📝</div>`, `Te quedas en el equipo.`, advanceNode);
}

function resolveTraining() {
    let mult = getInjuryMultiplier();
    if (Math.random() < (0.04 * mult)) { applyInjury("entrenamiento"); return; } 

    let roll = Math.random();
    let gain = 0;
    let grl = gameState.rating;

    if (grl >= 90) {
        if(roll < 0.90) gain = 0; else gain = 0.5;
    } else if (grl >= 85) {
        if(roll < 0.60) gain = 0; else if(roll < 0.90) gain = 0.5; else gain = 1;
    } else if (grl >= 75) {
        if(roll < 0.33) gain = 0; else if(roll < 0.66) gain = 0.5; else gain = 1;
    } else {
        if(roll < 0.33) gain = 0; else if(roll < 0.66) gain = 1; else gain = 2;
    }
    
    gameState.rating += gain;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    
    let displayRating = Math.round(gameState.rating * 10) / 10;
    let dynamicHtml = `<div class="rating-up">+${gain} GRL</div>`;
    
    if (gain > 0) {
        addLog(`Entrenamiento: GRL +${gain}. Media: ${displayRating}.`, "system");
        showModalResult("Entrenamiento", dynamicHtml, "Las horas de gimnasio han dado sus frutos.", advanceNode);
    } else {
        addLog(`Entrenamiento de mantenimiento. Nivel intacto.`, "system");
        showModalResult("Entrenamiento", dynamicHtml, grl >= 90 ? "En la élite ya no puedes mejorar más físicamente, solo mantener la forma." : "Un entrenamiento flojo. No has logrado mejorar hoy.", advanceNode);
    }
}

function resolveRest() {
    addLog(`Día de descanso completado.`, "system");
    showModalResult("Día Libre", `<div style="font-size:4rem">🛋️</div>`, "Has recargado pilas al 100%. No hay cambios en tu media (GRL).", advanceNode);
}

function resolveRandomEvent() {
    let roll = Math.random() * 100;
    let diff = 0; let msg = ""; let title = ""; let htmlIcon = "";
    
    if (roll < 10) { diff = -5; title = "¡Escándalo Nocturno!"; msg = "La prensa filtra unas fotos tuyas borracho. El club te destroza."; htmlIcon = "🚓"; } 
    else if (roll < 32) { diff = -2; title = "Problemas Personales"; msg = "Tu pareja te ha dejado y pasas por un bache emocional duro."; htmlIcon = "💔"; } 
    else if (roll < 68) { diff = 0; title = "Tarde Tranquila"; msg = "Aprovechas el tiempo libre para estar en casa y jugar a videojuegos."; htmlIcon = "🎮"; } 
    else if (roll < 90) { diff = 2; title = "Elogios del Míster"; msg = "El entrenador te elogia en rueda de prensa. Tu confianza sube."; htmlIcon = "🎤"; } 
    else { diff = 5; title = "¡Jugador del Mes!"; msg = "La liga te entrega el trofeo a Mejor Jugador del Mes. Tu fama se dispara."; htmlIcon = "🏅"; }
    
    gameState.rating += diff;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    let displayRating = Math.round(gameState.rating * 10) / 10;
    let sign = diff > 0 ? "+" : "";
    let classColor = diff > 0 ? "var(--grass-green)" : (diff < 0 ? "var(--danger-red)" : "var(--text-muted)");
    
    addLog(`Evento: ${title} (${sign}${diff} GRL). Nueva media: ${displayRating}`, diff < 0 ? "injury" : "system");
    let descHtml = `${msg}<br><br><strong style="color:${classColor};">Repercusión: ${sign}${diff} GRL</strong>`;
    showModalResult(title, `<div style="font-size:4rem">${htmlIcon}</div>`, descHtml, advanceNode);
}

function buildMatchHtml(myGoals, rivGoals, myId, rivId, rivName) {
    let myShieldHtml = getShieldHtml(myId, "50px", false);
    let rivalShieldHtml = getShieldHtml(rivId, "50px", false);
    return `
        <div class="match-result" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 1rem;">
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                ${myShieldHtml}<span class="match-team" style="text-align:center;">${gameState.team}</span>
            </div>
            <span class="match-score" style="font-size:2.5rem; font-weight:bold; padding:0 15px;">${myGoals} - ${rivGoals}</span>
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                ${rivalShieldHtml}<span class="match-team" style="text-align:center;">${rivName}</span>
            </div>
        </div>
    `;
}

function startLiveMatch(myGoals, rivGoals, myId, rivId, rivName, isFinal, isInjured, finalDesc, nextAction, currentFinalName) {
    DOM.modalOverlay.classList.add('hidden'); 
    DOM.liveMatchModal.classList.remove('hidden');

    DOM.liveTeam1Logo.innerHTML = getShieldHtml(myId, "50px", false);
    DOM.liveTeam2Logo.innerHTML = getShieldHtml(rivId, "50px", false);
    DOM.liveTeam1Name.textContent = gameState.team;
    DOM.liveTeam2Name.textContent = rivName;
    DOM.liveScore1.textContent = "0"; DOM.liveScore2.textContent = "0";
    DOM.liveEvents.innerHTML = ""; DOM.btnSkipMatch.classList.remove('hidden');

    let oldBtn = document.getElementById('btn-live-continue'); if(oldBtn) oldBtn.remove();
    let events = [];
    for(let i=0; i<myGoals; i++) events.push({ m: randomInt(2, 89), t: 'goal1', msg: `¡GOOOOOL del ${gameState.team}!` });
    for(let i=0; i<rivGoals; i++) events.push({ m: randomInt(2, 89), t: 'goal2', msg: `Gol del ${rivName}...` });
    if(isInjured) events.push({ m: randomInt(10, 80), t: 'inj', msg: `💥 Has sentido un pinchazo grave... Pides el cambio.` });
    for(let i=0; i<3; i++) events.push({ m: randomInt(5, 85), t: 'hl', msg: `Jugada de peligro que despeja la defensa.` });
    events.sort((a,b) => a.m - b.m);

    let minute = 0; let s1 = 0; let s2 = 0; let timer;

    function renderEvent(ev) {
        let div = document.createElement('div'); div.className = 'live-event';
        if(ev.t === 'goal1') { div.classList.add('goal'); s1++; DOM.liveScore1.textContent = s1; }
        if(ev.t === 'goal2') { div.classList.add('injury'); s2++; DOM.liveScore2.textContent = s2; div.style.color = "var(--danger-red)"; div.style.borderLeft="3px solid var(--danger-red)";}
        if(ev.t === 'inj') { div.classList.add('injury'); }
        if(ev.t === 'hl') { div.classList.add('highlight'); }
        if(ev.t === 'end') { div.classList.add('end'); }
        div.innerHTML = ev.t === 'end' ? ev.msg : `<strong>${ev.m}'</strong> - ${ev.msg}`;
        DOM.liveEvents.appendChild(div); DOM.liveEvents.scrollTop = DOM.liveEvents.scrollHeight;
    }

    function finishSim() {
        clearInterval(timer); DOM.liveTime.textContent = "90'"; DOM.liveScore1.textContent = myGoals; DOM.liveScore2.textContent = rivGoals; DOM.btnSkipMatch.classList.add('hidden');
        while(events.length > 0) renderEvent(events.shift());
        renderEvent({t: 'end', msg: '¡FINAL DEL PARTIDO!'});
        let btn = document.createElement('button'); btn.id = 'btn-live-continue'; btn.className = 'choice-btn action-btn'; btn.textContent = "Ir a Rueda de Prensa";
        btn.onclick = () => {
            DOM.liveMatchModal.classList.add('hidden'); btn.remove();
            let titleText = isFinal ? `Fin del Partido (${currentFinalName})` : "Pitido Final";
            showModalResult(titleText, buildMatchHtml(myGoals, rivGoals, myId, rivId, rivName), finalDesc, nextAction);
        };
        DOM.liveChoices.appendChild(btn);
    }
    DOM.btnSkipMatch.onclick = finishSim;
    timer = setInterval(() => {
        minute++; DOM.liveTime.textContent = minute + "'";
        while(events.length > 0 && events[0].m === minute) renderEvent(events.shift());
        if(minute >= 90) finishSim();
    }, 50);
}

function resolveMatch(isFinal) {
    gameState.matches++; gameState.matchesThisSeason++;
    let g = 0; let a = 0; let r = Math.random(); let grlBonus = (gameState.rating - 60) / 100;

    switch(gameState.playerPosition) {
        case "DC": if(r < 0.35 + grlBonus) g = 1; else if (r < 0.5 + grlBonus) g = 2; else if (r < 0.55 + grlBonus) g = 3; if(Math.random() < 0.2 + grlBonus) a = 1; break;
        case "EXT": if(r < 0.25 + grlBonus) g = 1; else if (r < 0.3 + grlBonus) g = 2; if(Math.random() < 0.35 + grlBonus) a = 1; else if (Math.random() < 0.45 + grlBonus) a = 2; break;
        case "MC": if(r < 0.15 + grlBonus) g = 1; if(Math.random() < 0.4 + grlBonus) a = 1; else if (Math.random() < 0.5 + grlBonus) a = 2; break;
        case "DEF": if(r < 0.05 + grlBonus) g = 1; if(Math.random() < 0.1 + grlBonus) a = 1; break;
    }
    
    gameState.goals += g; gameState.assists += a; gameState.goalsThisSeason += g; gameState.assistsThisSeason += a;

    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTier = getEffectiveTier(gameState.team); let myTeamId = myTeamInfo ? myTeamInfo.id : "default";

    let rivalInfo = null; let rivalName = "Rival"; let rivalTier = 4; let rivalId = "default"; let currentFinalName = null;

    if (isFinal) {
        currentFinalName = gameState.finalsReached[gameState.currentFinalIndex];
        let isEurope = ["Champions League", "Europa League", "Conference League"].includes(currentFinalName);
        let possibleRivals = [];
        if (isEurope) possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.europeanCompetition !== null && getEffectiveTier(t.name) <= 2 && t.name !== gameState.team) : [];
        else {
            possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && getEffectiveTier(t.name) <= 2 && t.name !== gameState.team) : [];
            if (possibleRivals.length === 0) possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && t.name !== gameState.team) : [];
        }
        if (possibleRivals.length > 0) rivalInfo = possibleRivals[Math.floor(Math.random() * possibleRivals.length)];
    } else {
        let rivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && t.name !== gameState.team) : [];
        if (rivals.length > 0) rivalInfo = rivals[Math.floor(Math.random() * rivals.length)];
    }

    if (rivalInfo) { rivalName = rivalInfo.name; rivalTier = getEffectiveTier(rivalName); rivalId = rivalInfo.id; }

    let myTeamGoalsBase = g + Math.floor(Math.random() * 2); 
    let rivalGoalsBase = Math.floor(Math.random() * 2);
    let tierDiff = rivalTier - myTier; 

    if (tierDiff > 0) myTeamGoalsBase += Math.floor(Math.random() * (tierDiff + 1));
    else if (tierDiff < 0) rivalGoalsBase += Math.floor(Math.random() * (Math.abs(tierDiff) * 2));

    let myTeamGoals = Math.max(g, myTeamGoalsBase); 
    let rivalGoals = Math.max(0, rivalGoalsBase);
    let matchResult = "draw"; 
    
    if (myTeamGoals > rivalGoals) matchResult = "win"; 
    else if (myTeamGoals < rivalGoals) matchResult = "loss";

    let desc = `Has marcado ${g} gol(es) y dado ${a} asistencia(s).`;

    if (isFinal) {
        if (myTeamGoals > rivalGoals) {
            matchResult = "win";
            gameState.trophies++;
            if (!gameState.titlesList) gameState.titlesList = [];
            gameState.titlesList.push(`${currentFinalName} (${gameState.team})`);
            gameState.titlesThisSeason = (gameState.titlesThisSeason || 0) + 1;
            desc += ` ¡CAMPEONES DE ${currentFinalName.toUpperCase()}!`; 
            addLog(`¡LEVANTAS EL TÍTULO DE ${currentFinalName.toUpperCase()}!`, "system");
        } else if (myTeamGoals < rivalGoals) {
            matchResult = "loss";
            desc += ` El ${rivalName} fue superior. Perdisteis la final.`;
            addLog(`Derrota dolorosa en la final de ${currentFinalName}.`);
        } else {
            // EMPATE EN LOS 90 MINUTOS - TANDA DE PENALTIS (50/50 REAL SIN GOL FANTASMA)
            if (Math.random() < 0.5) {
                matchResult = "win";
                desc += " ¡Victoria épica en los penaltis!";
                gameState.trophies++;
                if (!gameState.titlesList) gameState.titlesList = [];
                gameState.titlesList.push(`${currentFinalName} (${gameState.team})`);
                gameState.titlesThisSeason = (gameState.titlesThisSeason || 0) + 1;
                desc += ` ¡CAMPEONES DE ${currentFinalName.toUpperCase()}!`; 
                addLog(`¡LEVANTAS EL TÍTULO DE ${currentFinalName.toUpperCase()} EN PENALTIS!`, "system");
            } else {
                matchResult = "loss";
                desc += ` Derrota en la tanda de penaltis contra el ${rivalName}. El fútbol ha sido cruel hoy.`;
                addLog(`Derrota dolorosa en los penaltis de ${currentFinalName}.`);
            }
        }
    }

    let ratingChange = 0;
    
    if (gameState.rating >= 90) {
        if (matchResult === "win") ratingChange = 0; 
        else if (matchResult === "draw") ratingChange = -1; 
        else if (matchResult === "loss") ratingChange = -3;
    } else {
        if (myTier === 4) { if (matchResult === "win") ratingChange = 3; else if (matchResult === "draw") ratingChange = 1.5; else if (matchResult === "loss") ratingChange = 0; } 
        else if (myTier === 3) { if (matchResult === "win") ratingChange = 2.5; else if (matchResult === "draw") ratingChange = 1; else if (matchResult === "loss") ratingChange = 0; } 
        else if (myTier === 2) { if (matchResult === "win") ratingChange = 2; else if (matchResult === "draw") ratingChange = 0.5; else if (matchResult === "loss") ratingChange = -1; } 
        else if (myTier === 1) { if (matchResult === "win") ratingChange = 1; else if (matchResult === "draw") ratingChange = 0; else if (matchResult === "loss") ratingChange = -2; }
    }

    gameState.rating += ratingChange; gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    let sign = ratingChange > 0 ? "+" : ""; let ratingText = ratingChange !== 0 ? ` (Prensa: ${sign}${ratingChange} GRL)` : ` (Prensa: Invariable)`;
    addLog(`Partido contra ${rivalName} (${myTeamGoals}-${rivalGoals}). G: ${g}, A: ${a}.${ratingText}`);
    desc += `<br><br><strong style="color:var(--action-blue);">Repercusión en prensa: ${sign}${ratingChange} GRL</strong>`;

    let mult = getInjuryMultiplier();
    let isInjured = Math.random() < (0.07 * mult); 
    
    let nextAction;
    if (isFinal && gameState.currentFinalIndex < gameState.finalsReached.length - 1) {
        nextAction = () => {
            gameState.currentFinalIndex++;
            if (isInjured) applyInjury("partido"); 
            else openActionPanel({ id: gameState.currentNodeId, type: 'final_match' });
        };
    } else {
        nextAction = isInjured ? () => applyInjury("partido") : advanceNode;
    }

    let doSim = gameState.simMode === 2 || (gameState.simMode === 1 && isFinal);
    if (doSim) startLiveMatch(myTeamGoals, rivalGoals, myTeamId, rivalId, rivalName, isFinal, isInjured, desc, nextAction, currentFinalName);
    else { let titleText = isFinal ? `Fin del Partido (${currentFinalName})` : "Pitido Final"; showModalResult(titleText, buildMatchHtml(myTeamGoals, rivalGoals, myTeamId, rivalId, rivalName), desc, nextAction); }
}

function resolveSeasonSummary() {
    let simulatedMatches = 38 - gameState.matchesThisSeason;
    let summaryHtml = "";
    
    if (simulatedMatches > 0 && gameState.team !== "Agente Libre") {
        let grl = gameState.rating; let expectedG = 0, expectedA = 0;
        if (grl < 65) { expectedG = randomInt(0, 5); expectedA = randomInt(0, 3); }
        else if (grl <= 74) { expectedG = randomInt(3, 12); expectedA = randomInt(1, 6); }
        else if (grl <= 84) { expectedG = randomInt(8, 25); expectedA = randomInt(3, 12); }
        else { expectedG = randomInt(18, 45); expectedA = randomInt(6, 20); }

        let pos = gameState.playerPosition;
        if (pos === "DEF") { expectedG = Math.floor(expectedG * 0.15); expectedA = Math.floor(expectedA * 0.4); }
        else if (pos === "MC") { expectedG = Math.floor(expectedG * 0.4); expectedA = Math.floor(expectedA * 1.5); }
        else if (pos === "EXT") { expectedG = Math.floor(expectedG * 0.7); expectedA = Math.floor(expectedA * 1.2); }
        
        let extraG = Math.max(0, expectedG - gameState.goalsThisSeason); let extraA = Math.max(0, expectedA - gameState.assistsThisSeason);

        gameState.goals += extraG; gameState.assists += extraA; gameState.goalsThisSeason += extraG; gameState.assistsThisSeason += extraA; gameState.matches += simulatedMatches;

        let rChange = Math.random(); let diff = 0; let changeType = "";
        
        if (rChange < 0.70) { diff = randomInt(-1, 1); changeType = "Nivel mantenido"; } 
        else if (rChange < 0.95) { 
            if ((gameState.goalsThisSeason + gameState.assistsThisSeason) >= (expectedG + expectedA) * 0.7) { 
                diff = randomInt(1, 3); changeType = "Buena temporada"; 
            } else { 
                diff = randomInt(-2, -1); changeType = "Mala temporada"; 
            } 
        } 
        else { diff = randomInt(2, 4); changeType = "¡Sorpresa Élite!"; }
        
        if (gameState.rating >= 90) {
            let wonTitle = gameState.titlesThisSeason > 0;
            let eliteStats = (gameState.goalsThisSeason + gameState.assistsThisSeason) >= 35;
            if (!wonTitle || !eliteStats) {
                diff -= 3;
                changeType += " | Fracaso en la Élite (-3)";
            } else {
                diff += 1;
                changeType += " | Éxito en la Élite (+1)";
            }
        }

        if (gameState.rating > gameState.potential) {
            diff -= 2;
            changeType += ` | Techo de potencial`;
        }

        let ageDecline = 0;
        if (gameState.age >= 34) ageDecline = 4;
        else if (gameState.age >= 31) ageDecline = 2;
        else if (gameState.age >= 29) ageDecline = 1;

        if (ageDecline > 0) {
            diff -= ageDecline;
            changeType += ` | Declive físico (-${ageDecline})`;
        }

        gameState.rating += diff; gameState.rating = Math.max(40, Math.min(99, gameState.rating));
        let sign = diff > 0 ? "+" : "";

        addLog(`--- Temp. ${gameState.season} | ${gameState.goalsThisSeason} Goles | ${gameState.assistsThisSeason} Asis. ---`, "system");
        addLog(`Evolución de fin de año: ${sign}${diff} GRL.`, "system");

        let awardsMsg = "";
        if (gameState.goalsThisSeason >= 30) {
            let chance = (gameState.goalsThisSeason - 25) * 5; 
            if (Math.random() * 100 < chance) {
                gameState.goldenBoots = (gameState.goldenBoots || 0) + 1;
                awardsMsg += "<br><br>👟 <strong style='color:var(--gold-star)'>¡BOTA DE ORO!</strong> Eres el máximo goleador del mundo esta temporada.";
                addLog("👟 ¡Ganas la Bota de Oro por tus goles!", "system");
            }
        }

        if (getEffectiveTier(gameState.team) <= 2 && gameState.rating >= 85 && (gameState.goalsThisSeason + gameState.assistsThisSeason) >= 40 && gameState.titlesThisSeason > 0) {
            let bChance = (gameState.rating - 80) * 2 + (gameState.goalsThisSeason) * 1.5 + 25; 
            if (Math.random() * 100 < bChance) {
                gameState.ballonsDor = (gameState.ballonsDor || 0) + 1;
                awardsMsg += "<br><br>🌕 <strong style='color:var(--gold-star)'>¡BALÓN DE ORO!</strong> El mundo se rinde a tus pies. Eres el mejor jugador del planeta.";
                addLog("🌕 ¡HAS GANADO EL BALÓN DE ORO!", "system");
            }
        }

        let transferMsg = "";
        if (gameState.transfersThisSeason && gameState.transfersThisSeason.length > 0) {
            transferMsg = `<br><hr style="border-color: var(--border-color); margin: 15px 0;">
            <p style="color: var(--gold-star); font-size: 1.1rem; text-align:center;"><strong>Movimientos de Mercado</strong></p>`;
            gameState.transfersThisSeason.forEach(t => {
                transferMsg += `<p style="text-align:center;">➔ Traspaso al <strong>${t.team}</strong>: <span style="color:var(--grass-green)">${formatMoney(t.fee)}</span></p>`;
            });
        }

        summaryHtml = `
            <div style="text-align: left; font-size: 1.1rem; color: var(--text-light); line-height: 1.6; width: 100%;">
                <p><strong>Partidos Jugados:</strong> 38</p>
                <p><strong>Goles:</strong> ${gameState.goalsThisSeason}</p>
                <p><strong>Asistencias:</strong> ${gameState.assistsThisSeason}</p>
                <hr style="border-color: var(--border-color); margin: 15px 0;">
                <p style="color: var(--grass-green); font-size: 1.3rem; text-align:center;">
                    <strong>Evolución de Fin de Año: ${sign}${diff} GRL</strong> <br> 
                    <span style="font-size:0.9rem; color:var(--text-muted)">(${changeType})</span>
                </p>
                ${awardsMsg}
                ${transferMsg}
            </div>
        `;
    } else { summaryHtml = `<div style="font-size:1.2rem; color:var(--text-muted)">Sin minutos esta temporada.</div>`; }

    showModalResult("Fin de la Temporada", summaryHtml, "Aquí tienes el balance de tu año.", endSeason);
}

function advanceNode() { DOM.modalOverlay.classList.add('hidden'); gameState.currentTier++; saveState(); updateUI(); renderTree(); }

function endSeason() {
    DOM.modalOverlay.classList.add('hidden');
    gameState.season++; gameState.age++;
    
    if (gameState.age >= 45) {
        addLog("Has cumplido 45 años. Por reglamento médico y físico, te ves obligado a retirarte.", "system");
        setTimeout(() => { alert("¡Has cumplido 45 años! Tu cuerpo ya no aguanta el ritmo profesional. Es hora de colgar las botas y pasar a la historia."); retirePlayer(); }, 500);
        return;
    }

    if (gameState.age >= 35) {
        let retirementChance = 0.20 * Math.exp(0.3008 * (gameState.age - 35));
        if (Math.random() < retirementChance) {
            let percentLog = Math.min(99, Math.round(retirementChance * 100));
            addLog(`Tu cuerpo no aguanta más el ritmo (Riesgo: ${percentLog}%). Te retiras por problemas físicos.`, "injury");
            
            setTimeout(() => { 
                alert(`¡TU CUERPO HA DICHO BASTA!\n\nA tus ${gameState.age} años, el desgaste físico acumulado y los continuos problemas médicos te obligan a retirarte de forma prematura.\n\nEs hora de colgar las botas.`); 
                retirePlayer(); 
            }, 500);
            return; 
        }
    }

    if (gameState.team !== "Agente Libre") {
        gameState.seasonsAtCurrentClub = (gameState.seasonsAtCurrentClub || 0) + 1;
        if (gameState.seasonsAtCurrentClub >= 3) {
            if (!gameState.upgradedClubs) gameState.upgradedClubs = {};
            let currentTier = getEffectiveTier(gameState.team);
            if (currentTier > 1) { 
                gameState.upgradedClubs[gameState.team] = (gameState.upgradedClubs[gameState.team] || 0) + 1; let newTier = currentTier - 1;
                addLog(`🌟 ¡LEYENDA DEL CLUB! Llevas 3 años aquí y el ${gameState.team} sube de categoría a Tier ${newTier}.`, "system");
                alert(`🌟 ¡LEALTAD PREMIADA!\n\nGracias a tu rendimiento liderando el proyecto durante 3 temporadas, el ${gameState.team} ha crecido como club.\n\n¡A partir de ahora son considerados un equipo de Tier ${newTier}!`);
            }
            gameState.seasonsAtCurrentClub = 0;
        }
    }

    gameState.matchesThisSeason = 0; gameState.goalsThisSeason = 0; gameState.assistsThisSeason = 0;
    
    gameState.titlesThisSeason = 0;
    gameState.transfersThisSeason = [];
    gameState.visitedNodes = [];

    generateDiamondTree(); saveState(); updateUI(); renderTree();
}

function getRandomEventType() {
    let r = Math.random() * 100;
    if (r < 40) return 'match';
    if (r < 80) return 'training';
    if (r < 90) return 'rest';
    return 'random';
}

// --- NUEVO: ÁRBOL ASIMÉTRICO ESTILO "POKÉMON PATH" ---
// --- GENERACIÓN DE ÁRBOL DE 9 NIVELES (SILUETA ASIMÉTRICA: 1-2-3-4-3-4-3-2-1) ---
function generateDiamondTree() {
    gameState.currentTier = 0; gameState.finalsReached = []; gameState.currentFinalIndex = 0;
    if (!gameState.visitedNodes) gameState.visitedNodes = [];

    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTier = getEffectiveTier(gameState.team);
    
    let pCup = 0, pLeague = 0, pEurope = 0;
    if (myTier === 4) { pCup = 10; pLeague = 1; } else if (myTier === 3) { pCup = 20; pLeague = 5; } else if (myTier === 2) { pCup = 35; pLeague = 10; pEurope = 35; } else if (myTier === 1) { pCup = 40; pLeague = 70; pEurope = 40; }

    let myEuro = myTeamInfo ? myTeamInfo.europeanCompetition : null;
    if (myTier <= 2 && !myEuro) myEuro = myTier === 1 ? "Champions League" : "Europa League";

    if (Math.random() * 100 < pLeague) gameState.finalsReached.push("Liga");
    if (Math.random() * 100 < pCup) gameState.finalsReached.push("Copa");
    if (myEuro && (Math.random() * 100 < pEurope)) gameState.finalsReached.push(myEuro);

    let hasFinals = gameState.finalsReached.length > 0;

    // Configuración exacta solicitada para los 9 niveles de temporada
    const layoutConfig = [
        ['transfer'],                                                     // Tier 0 (1 nodo)
        [getRandomEventType(), getRandomEventType()],                     // Tier 1 (2 nodos)
        [getRandomEventType(), getRandomEventType(), getRandomEventType()], // Tier 2 (3 nodos)
        [getRandomEventType(), getRandomEventType(), getRandomEventType(), getRandomEventType()], // Tier 3 (4 nodos)
        [getRandomEventType(), 'transfer', getRandomEventType()],         // Tier 4 (3 nodos - Mercado de Invierno en el centro)
        [getRandomEventType(), getRandomEventType(), getRandomEventType(), getRandomEventType()], // Tier 5 (4 nodos)
        [getRandomEventType(), getRandomEventType(), getRandomEventType()], // Tier 6 (3 nodos)
        hasFinals ? ['final_match', 'final_match'] : [getRandomEventType(), getRandomEventType()], // Tier 7 (2 nodos - Finales)
        ['season_summary']                                                // Tier 8 (1 nodo - Fin de temporada)
    ];

    let tree = [];
    layoutConfig.forEach((row, rIndex) => { 
        let tierNodes = []; 
        row.forEach((type, cIndex) => { 
            let childrenIds = [];
            
            // Lógica matemática de interconexión de nodos según cambios de tamaño de fila
            if (rIndex < layoutConfig.length - 1) {
                let currLen = row.length;
                let nextLen = layoutConfig[rIndex+1].length;
                
                if (currLen === 1 && nextLen === 2) {
                    childrenIds = [`t${rIndex+1}_n0`, `t${rIndex+1}_n1`];
                } else if (currLen === 2 && nextLen === 3) {
                    if (cIndex === 0) childrenIds = [`t${rIndex+1}_n0`, `t${rIndex+1}_n1`];
                    else childrenIds = [`t${rIndex+1}_n1`, `t${rIndex+1}_n2`];
                } else if (currLen === 3 && nextLen === 4) {
                    if (cIndex === 0) childrenIds = [`t${rIndex+1}_n0`, `t${rIndex+1}_n1`];
                    else if (cIndex === 1) childrenIds = [`t${rIndex+1}_n1`, `t${rIndex+1}_n2`];
                    else childrenIds = [`t${rIndex+1}_n2`, `t${rIndex+1}_n3`];
                } else if (currLen === 4 && nextLen === 3) {
                    if (cIndex === 0) childrenIds = [`t${rIndex+1}_n0`];
                    else if (cIndex === 1) childrenIds = [`t${rIndex+1}_n0`, `t${rIndex+1}_n1`];
                    else if (cIndex === 2) childrenIds = [`t${rIndex+1}_n1`, `t${rIndex+1}_n2`];
                    else childrenIds = [`t${rIndex+1}_n2`];
                } else if (currLen === 3 && nextLen === 2) {
                    if (cIndex === 0) childrenIds = [`t${rIndex+1}_n0`];
                    else if (cIndex === 1) childrenIds = [`t${rIndex+1}_n0`, `t${rIndex+1}_n1`];
                    else childrenIds = [`t${rIndex+1}_n1`];
                } else if (currLen === 2 && nextLen === 1) {
                    childrenIds = [`t${rIndex+1}_n0`];
                }
            }
            tierNodes.push({ id: `t${rIndex}_n${cIndex}`, tier: rIndex, type: type, children: childrenIds }); 
        }); 
        tree.push(tierNodes); 
    });
    
    gameState.seasonTree = tree; gameState.currentNodeId = tree[0][0].id; 
}
function getChildrenIds(r, c, layout) {
    if (r >= layout.length - 1) return []; let children = []; let nextRowLen = layout[r+1].length; let currRowLen = layout[r].length;
    if (nextRowLen > currRowLen) { children.push(`t${r+1}_n${c}`); children.push(`t${r+1}_n${c+1}`); } else if (nextRowLen < currRowLen) { if (c > 0) children.push(`t${r+1}_n${c-1}`); if (c < nextRowLen) children.push(`t${r+1}_n${c}`); } else { children.push(`t${r+1}_n${c}`); }
    return [...new Set(children)];
}

function renderTree() {
    DOM.nodesWrapper.innerHTML = '';
    gameState.seasonTree.forEach((tier) => {
        const rowDiv = document.createElement('div'); rowDiv.className = 'tier-row';
        tier.forEach((node, index) => {
            const nodeEl = document.createElement('div'); nodeEl.className = 'event-node'; nodeEl.id = node.id; nodeEl.innerHTML = EVENT_ICONS[node.type];
            let titleText = 'Evento';
            if (node.type === 'transfer') titleText = 'Mercado'; else if (node.type === 'match') titleText = 'Partido'; else if (node.type === 'training') titleText = 'Entrenamiento'; else if (node.type === 'rest') titleText = 'Descanso'; else if (node.type === 'random') titleText = 'Sorpresa'; else if (node.type === 'season_summary') titleText = 'Resumen'; else if (node.type === 'final_match') titleText = 'Final';
            nodeEl.setAttribute('data-title', titleText);
            
            if (node.type === 'final_match') {
                nodeEl.style.borderColor = "var(--danger-red)"; nodeEl.style.boxShadow = "0 0 15px rgba(239,68,68,0.5)";
                const finalLabel = document.createElement('div'); finalLabel.textContent = "FINAL"; finalLabel.style.position = "absolute"; finalLabel.style.top = "-22px"; finalLabel.style.backgroundColor = "var(--danger-red)"; finalLabel.style.color = "white"; finalLabel.style.padding = "2px 8px"; finalLabel.style.borderRadius = "4px"; finalLabel.style.fontSize = "0.75rem"; finalLabel.style.fontWeight = "bold"; finalLabel.style.letterSpacing = "1px"; nodeEl.appendChild(finalLabel);
            }
            
            // --- NUEVO: MATEMÁTICAS DE INCLINACIÓN (Coordenadas en 'rem') ---
            let rowLen = tier.length;
            let offsetX = 0;

            
            // Calculamos la coordenada X exacta basándonos en tus ángulos (45º, 30º, 20º)
            if (rowLen === 1) {
                offsetX = 0;
            } else if (rowLen === 2) {
                offsetX = index === 0 ? -10 : 10; 
            } else if (rowLen === 3) {
                if (index === 0) offsetX = -13.1;
                else if (index === 1) offsetX = 0;
                else offsetX = 13.1;
            } else if (rowLen === 4) {
                if (index === 0) offsetX = -16.2;
                else if (index === 1) offsetX = -5.8;
                else if (index === 2) offsetX = 5.8;
                else offsetX = 16.2;
            }

            // Aplicamos la posición física exacta en el CSS
            nodeEl.style.left = `calc(50% + ${offsetX}rem)`;
            // ----------------------------------------------------------------

            if (gameState.visitedNodes && gameState.visitedNodes.includes(node.id)) { 
                nodeEl.classList.add('completed'); 
            } else if (node.tier < gameState.currentTier) { 
                nodeEl.classList.add('locked'); 
                nodeEl.style.opacity = '0.3';
                nodeEl.style.filter = 'grayscale(100%)';
            } else if (node.tier === gameState.currentTier) { 
                if (gameState.currentTier === 0 || isChildOfCurrent(node.id)) { 
                    nodeEl.classList.add('active'); 
                    nodeEl.addEventListener('click', () => openActionPanel(node)); 
                } else { 
                    nodeEl.classList.add('locked'); 
                } 
            } else { 
                nodeEl.classList.add('locked'); 
            }
            
            rowDiv.appendChild(nodeEl);
        });
        DOM.nodesWrapper.appendChild(rowDiv);
    });
    setTimeout(drawLines, 50); 
}

function isChildOfCurrent(nodeId) {
    if (gameState.currentTier === 0) return true;
    const prevNode = findNode(gameState.currentNodeId);
    if (prevNode && prevNode.tier === gameState.currentTier - 1) return prevNode.children.includes(nodeId);
    return true;
}

function drawLines() {
    DOM.treeLines.innerHTML = ''; const svgRect = DOM.treeLines.getBoundingClientRect();
    gameState.seasonTree.forEach(tier => {
        tier.forEach(node => {
            const el1 = document.getElementById(node.id); if (!el1) return; const rect1 = el1.getBoundingClientRect();
            const x1 = rect1.left - svgRect.left + (rect1.width / 2); const y1 = rect1.top - svgRect.top + (rect1.height / 2);
            node.children.forEach(childId => {
                const el2 = document.getElementById(childId); if (!el2) return; const rect2 = el2.getBoundingClientRect();
                const x2 = rect2.left - svgRect.left + (rect2.width / 2); const y2 = rect2.top - svgRect.top + (rect2.height / 2);
                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2); line.classList.add('path-line');
                
                if (gameState.visitedNodes && gameState.visitedNodes.includes(node.id) && gameState.visitedNodes.includes(childId)) {
                    line.classList.add('active'); 
                }
                
                DOM.treeLines.appendChild(line);
            });
        });
    });
}

function findNode(id) { for (let tier of gameState.seasonTree) { for (let node of tier) { if (node.id === id) return node; } } return null; }

window.onload = init;