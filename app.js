// --- ESTADO GLOBAL DEL JUEGO ---
const SAVE_KEY = 'football_roguelike_save';

const defaultState = {
    playerName: "Jugador",
    playerNumber: 10,
    playerPosition: "DC",
    age: 18,
    season: 1,
    team: "Agente Libre",
    league: "Ninguna",
    rating: 60, 
    goals: 0,
    assists: 0,
    matches: 0,
    matchesThisSeason: 0,
    goalsThisSeason: 0,
    assistsThisSeason: 0,
    trophies: 0,
    teamsPlayed: [],
    currentTier: 0, 
    currentNodeId: null, 
    seasonTree: [],
    finalsReached: [], 
    currentFinalIndex: 0, 
    simMode: 1,
    seasonsAtCurrentClub: 0, 
    upgradedClubs: {}        
};

let gameState = {};

// --- CONFIGURACIÓN DE ESCUDOS ---
const IMAGE_FOLDER = "graphics"; 
const IMAGE_EXT = ".png";        

// --- ELEMENTOS DEL DOM ---
const DOM = {
    startScreen: document.getElementById('start-screen'),
    startMenu: document.getElementById('start-menu'),
    btnContinue: document.getElementById('btn-continue'),
    btnNewCareer: document.getElementById('btn-new-career'),
    newCareerForm: document.getElementById('new-career-form'),
    inputName: document.getElementById('input-name'),
    inputNumber: document.getElementById('input-number'),
    inputPosition: document.getElementById('input-position'),
    btnStartGame: document.getElementById('btn-start-game'),
    btnBackMenu: document.getElementById('btn-back-menu'),
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
    btnBackToMain: document.getElementById('btn-back-to-main')
};

// NUEVOS ICONOS AÑADIDOS
const EVENT_ICONS = {
    transfer: "🤝",
    match: "⚽",
    training: "🏋️",
    final_match: "🏆",
    season_summary: "📊",
    rest: "🛋️",
    random: "❓"
};

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getEffectiveTier(teamName) {
    let teamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === teamName) : null;
    if (!teamInfo) return 4;
    let baseTier = teamInfo.tier;
    let upgrades = (gameState.upgradedClubs && gameState.upgradedClubs[teamName]) ? gameState.upgradedClubs[teamName] : 0;
    return Math.max(1, baseTier - upgrades); 
}

function getShieldHtml(teamId, size = "50px", isInline = false) {
    if (!teamId || teamId === "default") {
        return `<div style="width:${size}; height:${size}; display:${isInline ? 'inline-flex' : 'flex'}; justify-content:center; align-items:center; background:var(--border-color); border-radius:50%; margin-${isInline ? 'right' : 'bottom'}:8px; font-size:${parseInt(size)/2}px;">👤</div>`;
    }
    return `<img src="${IMAGE_FOLDER}/${teamId}${IMAGE_EXT}" alt="${teamId}" style="width:${size}; height:${size}; object-fit:contain; ${isInline ? 'vertical-align:middle; margin-right:8px;' : 'margin-bottom:8px;'}">`;
}

// --- INICIALIZACIÓN ---
function init() {
    DOM.btnNewCareer.addEventListener('click', showNewCareerForm);
    DOM.btnBackMenu.addEventListener('click', hideNewCareerForm);
    DOM.btnStartGame.addEventListener('click', startNewCareer);
    DOM.btnContinue.addEventListener('click', continueCareer);
    DOM.btnReset.addEventListener('click', resetGame);
    
    DOM.btnRetire.addEventListener('click', confirmRetirement);
    DOM.btnBackToMain.addEventListener('click', () => location.reload());
    
    DOM.btnToggleSim.addEventListener('click', toggleSimMode);

    window.addEventListener('resize', drawLines);
    checkSaveData();
}

function checkSaveData() {
    if (localStorage.getItem(SAVE_KEY)) DOM.btnContinue.classList.remove('hidden');
}

function showNewCareerForm() {
    DOM.startMenu.classList.add('hidden');
    DOM.newCareerForm.classList.remove('hidden');
}

function hideNewCareerForm() {
    DOM.newCareerForm.classList.add('hidden');
    DOM.startMenu.classList.remove('hidden');
}

function startNewCareer() {
    const name = DOM.inputName.value.trim() || "Promesa Anónima";
    const number = DOM.inputNumber.value || 10;
    const position = DOM.inputPosition.value;

    gameState = { ...defaultState };
    gameState.teamsPlayed = [];
    gameState.seasonTree = [];
    gameState.upgradedClubs = {}; 
    gameState.finalsReached = [];
    gameState.currentFinalIndex = 0;
    gameState.playerName = name;
    gameState.playerNumber = number;
    gameState.playerPosition = position;

    generateDiamondTree();
    saveState();
    startGameUI();
    addLog(`¡Bienvenido al fútbol profesional, ${name}! Inicias como ${position}.`, "system");
}

function continueCareer() {
    gameState = JSON.parse(localStorage.getItem(SAVE_KEY));
    if (gameState.simMode === undefined) gameState.simMode = 1; 
    if (gameState.seasonsAtCurrentClub === undefined) gameState.seasonsAtCurrentClub = 0;
    if (gameState.upgradedClubs === undefined) gameState.upgradedClubs = {};
    if (gameState.finalsReached === undefined) gameState.finalsReached = [];
    if (gameState.currentFinalIndex === undefined) gameState.currentFinalIndex = 0;
    
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

function saveState() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(gameState));
}

function resetGame() {
    if (confirm("¿Seguro que quieres abandonar tu carrera y volver al menú principal? Se borrará todo.")) {
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

function confirmRetirement() {
    if (confirm("¿Estás seguro de que quieres colgar las botas? Esto finalizará tu carrera para siempre y te llevará al salón de la fama.")) {
        retirePlayer();
    }
}

function retirePlayer() {
    DOM.gameUI.classList.add('hidden');
    DOM.retirementScreen.classList.remove('hidden');

    let clubsHtml = gameState.teamsPlayed.map(teamName => {
        let teamInfo = TEAMS_DB.find(t => t.name === teamName);
        let tId = teamInfo ? teamInfo.id : "default";
        return getShieldHtml(tId, "45px", true);
    }).join("");

    if(clubsHtml === "") clubsHtml = "<span style='color:var(--text-muted)'>Ninguno (Leal a la Agencia Libre)</span>";

    DOM.retirementSummary.innerHTML = `
        <div class="retirement-stats-grid">
            <div class="retire-box">
                <h4>Partidos</h4>
                <span>${gameState.matches}</span>
            </div>
            <div class="retire-box">
                <h4>Goles</h4>
                <span>${gameState.goals}</span>
            </div>
            <div class="retire-box">
                <h4>Asistencias</h4>
                <span>${gameState.assists}</span>
            </div>
            <div class="retire-box">
                <h4>Trofeos</h4>
                <span>${gameState.trophies}</span>
            </div>
            <div class="retire-clubs">
                <h4>Clubes Representados</h4>
                <div style="display:flex; flex-wrap:wrap; gap:10px; margin-top:10px;">
                    ${clubsHtml}
                </div>
            </div>
        </div>
    `;
    localStorage.removeItem(SAVE_KEY);
}

function updateUI() {
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
}

function addLog(msg, type = "normal") {
    const li = document.createElement('li');
    li.textContent = `[T${gameState.season}] ${msg}`;
    li.className = `log-entry ${type}`;
    DOM.logList.prepend(li);
}

function openModal(title, desc) {
    DOM.modalTitle.textContent = title;
    DOM.modalDesc.innerHTML = desc; 
    DOM.modalDynamic.innerHTML = ''; 
    DOM.modalChoices.innerHTML = '';
    DOM.modalOverlay.classList.remove('hidden');
}

function addChoice(html, action, isDanger = false) {
    const btn = document.createElement('button');
    btn.className = `choice-btn ${isDanger ? 'danger' : ''}`;
    btn.innerHTML = html;
    btn.addEventListener('click', action);
    DOM.modalChoices.appendChild(btn);
}

function showModalResult(title, dynamicHtml, descHtml, continueCallback) {
    DOM.modalTitle.textContent = title;
    DOM.modalDynamic.innerHTML = dynamicHtml;
    DOM.modalDesc.innerHTML = descHtml;
    DOM.modalChoices.innerHTML = '';
    addChoice("Continuar", continueCallback);
    DOM.modalOverlay.classList.remove('hidden');
}

function getInjuryMultiplier() {
    if (gameState.age >= 40) return 3;
    if (gameState.age >= 34) return 2;
    return 1;
}

function applyInjury(sourceContext) {
    const injuries = [
        { name: "Rotura de Ligamento Cruzado", skip: 99, penalty: 8 },
        { name: "Esguince Grave", skip: 3, penalty: 5 },
        { name: "Lesión en el Gemelo", skip: 2, penalty: 3 },
        { name: "Molestias en el Cuádriceps", skip: 1, penalty: 2 }
    ];
    
    let injury = injuries[Math.floor(Math.random() * injuries.length)];
    
    gameState.rating -= injury.penalty;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    let displayRating = Math.round(gameState.rating * 10) / 10;
    
    addLog(`¡TERRIBLE! Te has lesionado: ${injury.name}. Has perdido ${injury.penalty} GRL.`, "injury");
    
    let dynamicHtml = `<div style="font-size:4rem">🚑</div>`;
    let descHtml = `Has sufrido una <strong>${injury.name}</strong> durante el ${sourceContext}. <br><br><strong style="color:var(--danger-red);">Repercusión médica: -${injury.penalty} GRL</strong><br>Tu media ha bajado a: ${displayRating}.`;
    
    if (injury.skip === 99) {
        descHtml += "<br><br>Te pierdes el resto de la temporada por completo. Se acabó el año para ti...";
    } else {
        descHtml += `<br><br>Estarás de baja de forma obligatoria y te perderás los próximos ${injury.skip} eventos del calendario.`;
    }
    
    showModalResult("¡LESIÓN GRAVE!", dynamicHtml, descHtml, () => {
        if (injury.skip === 99) {
            DOM.modalOverlay.classList.add('hidden');
            endSeason();
        } else {
            gameState.currentTier += (injury.skip + 1); 
            if (gameState.currentTier >= gameState.seasonTree.length) {
                resolveSeasonSummary(); 
            } else {
                DOM.modalOverlay.classList.add('hidden');
                saveState();
                updateUI();
                renderTree();
            }
        }
    });
}

function getOfferTier(rating) {
    let r = Math.random() * 100;
    if (rating >= 85) {
        if (r < 80) return 1; if (r < 95) return 2; if (r < 99) return 3; return 4;
    } else if (rating >= 75) {
        if (r < 12) return 1; if (r < 82) return 2; if (r < 96) return 3; return 4;
    } else if (rating >= 65) {
        if (r < 4) return 1; if (r < 17) return 2; if (r < 80) return 3; return 4;
    } else {
        return 4; 
    }
}

// --- MANEJO DE EVENTOS ---
function openActionPanel(node) {
    gameState.currentNodeId = node.id; 
    
    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTeamId = myTeamInfo ? myTeamInfo.id : "default";

    if (node.type === 'transfer') {
        openModal("Mercado de Fichajes", "Tu agente te trae ofertas basadas en tu rendimiento actual.");
        
        let offers = [];
        for(let i=0; i<2; i++) {
            let targetTier = getOfferTier(gameState.rating);
            let possibleTeams = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => getEffectiveTier(t.name) === targetTier && t.name !== gameState.team) : [];
            if(possibleTeams.length > 0) {
                let randomTeam = possibleTeams[Math.floor(Math.random() * possibleTeams.length)];
                if(!offers.some(o => o.name === randomTeam.name)) offers.push(randomTeam);
            }
        }

        offers.forEach(offer => {
            let logoHtml = getShieldHtml(offer.id, "24px", true);
            addChoice(`${logoHtml} Fichar por ${offer.name} (${offer.league})`, () => acceptOffer(offer));
        });

        if (gameState.team !== "Agente Libre") {
            let myLogoHtml = getShieldHtml(myTeamId, "24px", true);
            addChoice(`${myLogoHtml} Quedarme en el ${gameState.team}`, () => stayAtClub());
        } else if (offers.length === 0) {
            let fallback = TEAMS_DB[Math.floor(Math.random() * TEAMS_DB.length)];
            let fbLogo = getShieldHtml(fallback.id, "24px", true);
            addChoice(`${fbLogo} Aceptar oferta del ${fallback.name}`, () => acceptOffer(fallback));
        }
        
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

function acceptOffer(teamObj) {
    gameState.team = teamObj.name;
    gameState.league = teamObj.league;
    gameState.seasonsAtCurrentClub = 0; 

    if (!gameState.teamsPlayed.includes(teamObj.name)) gameState.teamsPlayed.push(teamObj.name);

    addLog(`Fichas por el ${teamObj.name}.`, "system");
    let logoHtml = `<img src="${IMAGE_FOLDER}/${teamObj.id}${IMAGE_EXT}" alt="${teamObj.name}" style="height:100px; object-fit:contain;" onerror="this.style.display='none'">`;
    showModalResult("Fichaje Cerrado", logoHtml, `Bienvenido a tu nuevo hogar: ${teamObj.name}.`, advanceNode);
}

function stayAtClub() {
    addLog(`Renuevas tu lealtad con el ${gameState.team}.`);
    showModalResult("Contrato Extendido", `<div style="font-size:4rem">📝</div>`, `Te quedas en el equipo.`, advanceNode);
}

function resolveTraining() {
    let mult = getInjuryMultiplier();
    if (Math.random() < (0.08 * mult)) {
        applyInjury("entrenamiento");
        return; 
    }

    let roll = Math.random();
    let gain = 0;
    if (roll < 0.33) gain = 0;
    else if (roll < 0.66) gain = 1;
    else gain = 2;
    
    gameState.rating += gain;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    
    let displayRating = Math.round(gameState.rating * 10) / 10;
    let dynamicHtml = `<div class="rating-up">+${gain} GRL</div>`;
    
    if (gain > 0) {
        addLog(`Entrenamiento completado: GRL +${gain}. Nueva media: ${displayRating}.`, "system");
        showModalResult("Entrenamiento Físico", dynamicHtml, "Las horas de gimnasio han dado sus frutos.", advanceNode);
    } else {
        addLog(`Entrenamiento completado pero sin mejora notable.`, "system");
        showModalResult("Entrenamiento Físico", dynamicHtml, "Un entrenamiento flojo. No has logrado mejorar tu técnica hoy.", advanceNode);
    }
}

function resolveRest() {
    addLog(`Día de descanso completado.`, "system");
    showModalResult("Día Libre", `<div style="font-size:4rem">🛋️</div>`, "Has recargado pilas al 100%. No hay cambios en tu media (GRL).", advanceNode);
}

function resolveRandomEvent() {
    let roll = Math.random() * 100;
    let diff = 0;
    let msg = "";
    let title = "";
    let htmlIcon = "";
    
    if (roll < 10) { // 10%: -5
        diff = -5;
        title = "¡Escándalo Nocturno!";
        msg = "La prensa filtra unas fotos tuyas borracho perdido conduciendo de madrugada. El club y la afición te destrozan.";
        htmlIcon = "🚓";
    } else if (roll < 32) { // 22%: -2
        diff = -2;
        title = "Problemas Personales";
        msg = "Tu pareja te ha dejado y estás pasando por un bache emocional muy duro. Tu rendimiento baja.";
        htmlIcon = "💔";
    } else if (roll < 68) { // 36%: +0
        diff = 0;
        title = "Tarde Tranquila";
        msg = "Aprovechas el tiempo libre para estar en casa, jugar a videojuegos y desconectar de la presión del fútbol.";
        htmlIcon = "🎮";
    } else if (roll < 90) { // 22%: +2
        diff = 2;
        title = "Elogios del Míster";
        msg = "El entrenador te nombra específicamente en la rueda de prensa destacando tu implicación. Tu confianza sube por las nubes.";
        htmlIcon = "🎤";
    } else { // 10%: +5
        diff = 5;
        title = "¡Jugador del Mes!";
        msg = "La liga te entrega el trofeo a Mejor Jugador del Mes. Estás en tu prime absoluto y tu fama se dispara.";
        htmlIcon = "🏅";
    }
    
    gameState.rating += diff;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    
    let displayRating = Math.round(gameState.rating * 10) / 10;
    let sign = diff > 0 ? "+" : "";
    let classColor = diff > 0 ? "var(--grass-green)" : (diff < 0 ? "var(--danger-red)" : "var(--text-muted)");
    
    addLog(`Evento: ${title} (${sign}${diff} GRL). Nueva media: ${displayRating}`, diff < 0 ? "injury" : "system");
    
    let descHtml = `${msg}<br><br><strong style="color:${classColor};">Repercusión: ${sign}${diff} GRL</strong>`;
    let dynamicHtml = `<div style="font-size:4rem">${htmlIcon}</div>`;
    
    showModalResult(title, dynamicHtml, descHtml, advanceNode);
}

function buildMatchHtml(myGoals, rivGoals, myId, rivId, rivName) {
    let myShieldHtml = getShieldHtml(myId, "50px", false);
    let rivalShieldHtml = getShieldHtml(rivId, "50px", false);
    return `
        <div class="match-result" style="display:flex; justify-content:space-between; align-items:center; width:100%; padding: 1rem;">
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                ${myShieldHtml}
                <span class="match-team" style="text-align:center;">${gameState.team}</span>
            </div>
            <span class="match-score" style="font-size:2.5rem; font-weight:bold; padding:0 15px;">${myGoals} - ${rivGoals}</span>
            <div style="display:flex; flex-direction:column; align-items:center; flex:1;">
                ${rivalShieldHtml}
                <span class="match-team" style="text-align:center;">${rivName}</span>
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
    DOM.liveScore1.textContent = "0";
    DOM.liveScore2.textContent = "0";
    DOM.liveEvents.innerHTML = "";
    DOM.btnSkipMatch.classList.remove('hidden');

    let oldBtn = document.getElementById('btn-live-continue');
    if(oldBtn) oldBtn.remove();

    let events = [];
    for(let i=0; i<myGoals; i++) events.push({ m: randomInt(2, 89), t: 'goal1', msg: `¡GOOOOOL del ${gameState.team}!` });
    for(let i=0; i<rivGoals; i++) events.push({ m: randomInt(2, 89), t: 'goal2', msg: `Gol del ${rivName}...` });
    
    if(isInjured) events.push({ m: randomInt(10, 80), t: 'inj', msg: `💥 Has sentido un pinchazo grave... Tienes que pedir el cambio.` });

    for(let i=0; i<3; i++) events.push({ m: randomInt(5, 85), t: 'hl', msg: `Jugada de gran peligro que termina despejando la defensa.` });

    events.sort((a,b) => a.m - b.m);

    let minute = 0;
    let s1 = 0; let s2 = 0;
    let timer;

    function renderEvent(ev) {
        let div = document.createElement('div');
        div.className = 'live-event';
        if(ev.t === 'goal1') { div.classList.add('goal'); s1++; DOM.liveScore1.textContent = s1; }
        if(ev.t === 'goal2') { div.classList.add('injury'); s2++; DOM.liveScore2.textContent = s2; div.style.color = "var(--danger-red)"; div.style.borderLeft="3px solid var(--danger-red)";}
        if(ev.t === 'inj') { div.classList.add('injury'); }
        if(ev.t === 'hl') { div.classList.add('highlight'); }
        if(ev.t === 'end') { div.classList.add('end'); }

        div.innerHTML = ev.t === 'end' ? ev.msg : `<strong>${ev.m}'</strong> - ${ev.msg}`;
        DOM.liveEvents.appendChild(div);
        DOM.liveEvents.scrollTop = DOM.liveEvents.scrollHeight;
    }

    function finishSim() {
        clearInterval(timer);
        DOM.liveTime.textContent = "90'";
        DOM.liveScore1.textContent = myGoals;
        DOM.liveScore2.textContent = rivGoals;
        DOM.btnSkipMatch.classList.add('hidden');

        while(events.length > 0) renderEvent(events.shift());
        renderEvent({t: 'end', msg: '¡FINAL DEL PARTIDO!'});

        let btn = document.createElement('button');
        btn.id = 'btn-live-continue';
        btn.className = 'choice-btn action-btn';
        btn.textContent = "Ir a Rueda de Prensa";
        btn.onclick = () => {
            DOM.liveMatchModal.classList.add('hidden');
            btn.remove();
            let titleText = isFinal ? `Fin del Partido (${currentFinalName})` : "Pitido Final";
            showModalResult(titleText, buildMatchHtml(myGoals, rivGoals, myId, rivId, rivName), finalDesc, nextAction);
        };
        DOM.liveChoices.appendChild(btn);
    }

    DOM.btnSkipMatch.onclick = finishSim;

    timer = setInterval(() => {
        minute++;
        DOM.liveTime.textContent = minute + "'";
        while(events.length > 0 && events[0].m === minute) renderEvent(events.shift());
        if(minute >= 90) finishSim();
    }, 50);
}

function resolveMatch(isFinal) {
    gameState.matches++;
    gameState.matchesThisSeason++;
    
    let g = 0; let a = 0;
    let r = Math.random();
    let grlBonus = (gameState.rating - 60) / 100;

    switch(gameState.playerPosition) {
        case "DC":
            if(r < 0.35 + grlBonus) g = 1; else if (r < 0.5 + grlBonus) g = 2; else if (r < 0.55 + grlBonus) g = 3;
            if(Math.random() < 0.2 + grlBonus) a = 1; break;
        case "EXT":
            if(r < 0.25 + grlBonus) g = 1; else if (r < 0.3 + grlBonus) g = 2;
            if(Math.random() < 0.35 + grlBonus) a = 1; else if (Math.random() < 0.45 + grlBonus) a = 2; break;
        case "MC":
            if(r < 0.15 + grlBonus) g = 1;
            if(Math.random() < 0.4 + grlBonus) a = 1; else if (Math.random() < 0.5 + grlBonus) a = 2; break;
        case "DEF":
            if(r < 0.05 + grlBonus) g = 1; 
            if(Math.random() < 0.1 + grlBonus) a = 1; break;
    }
    
    gameState.goals += g;
    gameState.assists += a;
    gameState.goalsThisSeason += g;
    gameState.assistsThisSeason += a;

    let myTeamInfo = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.find(t => t.name === gameState.team) : null;
    let myTier = getEffectiveTier(gameState.team);
    let myTeamId = myTeamInfo ? myTeamInfo.id : "default";

    let rivalInfo = null;
    let rivalName = "Rival";
    let rivalTier = 4;
    let rivalId = "default";
    
    let currentFinalName = null;

    if (isFinal) {
        currentFinalName = gameState.finalsReached[gameState.currentFinalIndex];
        let isEurope = ["Champions League", "Europa League", "Conference League"].includes(currentFinalName);
        let possibleRivals = [];
        
        if (isEurope) {
            possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.europeanCompetition !== null && getEffectiveTier(t.name) <= 2 && t.name !== gameState.team) : [];
        } else {
            possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && getEffectiveTier(t.name) <= 2 && t.name !== gameState.team) : [];
            if (possibleRivals.length === 0) {
                possibleRivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && t.name !== gameState.team) : [];
            }
        }
        if (possibleRivals.length > 0) rivalInfo = possibleRivals[Math.floor(Math.random() * possibleRivals.length)];
    } else {
        let rivals = typeof TEAMS_DB !== 'undefined' ? TEAMS_DB.filter(t => t.league === gameState.league && t.name !== gameState.team) : [];
        if (rivals.length > 0) rivalInfo = rivals[Math.floor(Math.random() * rivals.length)];
    }

    if (rivalInfo) {
        rivalName = rivalInfo.name;
        rivalTier = getEffectiveTier(rivalName);
        rivalId = rivalInfo.id;
    }

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
        if (myTeamGoals > rivalGoals || (myTeamGoals === rivalGoals && Math.random() > 0.5)) {
            matchResult = "win";
            if (myTeamGoals === rivalGoals) desc += " ¡Victoria épica en los penaltis!";
            gameState.trophies++;
            desc += ` ¡CAMPEONES DE ${currentFinalName.toUpperCase()}!`;
            addLog(`¡LEVANTAS EL TÍTULO DE ${currentFinalName.toUpperCase()}!`, "system");
        } else {
            matchResult = "loss";
            if (myTeamGoals === rivalGoals) {
                rivalGoals++; 
                desc += ` Derrota en los penaltis contra el ${rivalName}. El fútbol ha sido cruel hoy.`;
            } else {
                desc += ` El ${rivalName} fue superior. Perdisteis la final.`;
            }
            addLog(`Derrota dolorosa en la final de ${currentFinalName}.`);
        }
    }

    let ratingChange = 0;
    if (myTier === 4) {
        if (matchResult === "win") ratingChange = 3; else if (matchResult === "draw") ratingChange = 1.5; else if (matchResult === "loss") ratingChange = 0;
    } else if (myTier === 3) {
        if (matchResult === "win") ratingChange = 2.5; else if (matchResult === "draw") ratingChange = 1; else if (matchResult === "loss") ratingChange = 0;
    } else if (myTier === 2) {
        if (matchResult === "win") ratingChange = 2; else if (matchResult === "draw") ratingChange = 0.5; else if (matchResult === "loss") ratingChange = -1;
    } else if (myTier === 1) {
        if (matchResult === "win") ratingChange = 1; else if (matchResult === "draw") ratingChange = 0; else if (matchResult === "loss") ratingChange = -2;
    }

    gameState.rating += ratingChange;
    gameState.rating = Math.max(40, Math.min(99, gameState.rating));
    
    let sign = ratingChange > 0 ? "+" : "";
    let ratingText = ratingChange !== 0 ? ` (Prensa: ${sign}${ratingChange} GRL)` : ` (Prensa: Invariable)`;
    
    addLog(`Partido contra ${rivalName} (${myTeamGoals}-${rivalGoals}). G: ${g}, A: ${a}.${ratingText}`);
    desc += `<br><br><strong style="color:var(--action-blue);">Repercusión en prensa: ${sign}${ratingChange} GRL</strong>`;

    let mult = getInjuryMultiplier();
    let isInjured = Math.random() < (0.15 * mult);
    
    let nextAction;
    if (isFinal && gameState.currentFinalIndex < gameState.finalsReached.length - 1) {
        nextAction = () => {
            gameState.currentFinalIndex++;
            if (isInjured) {
                applyInjury("partido"); 
            } else {
                openActionPanel({ id: gameState.currentNodeId, type: 'final_match' });
            }
        };
    } else {
        nextAction = isInjured ? () => applyInjury("partido") : advanceNode;
    }

    let doSim = gameState.simMode === 2 || (gameState.simMode === 1 && isFinal);

    if (doSim) {
        startLiveMatch(myTeamGoals, rivalGoals, myTeamId, rivalId, rivalName, isFinal, isInjured, desc, nextAction, currentFinalName);
    } else {
        let titleText = isFinal ? `Fin del Partido (${currentFinalName})` : "Pitido Final";
        showModalResult(titleText, buildMatchHtml(myTeamGoals, rivalGoals, myTeamId, rivalId, rivalName), desc, nextAction);
    }
}

function resolveSeasonSummary() {
    let simulatedMatches = 38 - gameState.matchesThisSeason;
    let summaryHtml = "";
    
    if (simulatedMatches > 0 && gameState.team !== "Agente Libre") {
        let grl = gameState.rating;
        let expectedG = 0, expectedA = 0;
        
        if (grl < 65) { expectedG = randomInt(0, 5); expectedA = randomInt(0, 3); }
        else if (grl <= 74) { expectedG = randomInt(3, 12); expectedA = randomInt(1, 6); }
        else if (grl <= 84) { expectedG = randomInt(8, 25); expectedA = randomInt(3, 12); }
        else { expectedG = randomInt(18, 45); expectedA = randomInt(6, 20); }

        let pos = gameState.playerPosition;
        if (pos === "DEF") { expectedG = Math.floor(expectedG * 0.15); expectedA = Math.floor(expectedA * 0.4); }
        else if (pos === "MC") { expectedG = Math.floor(expectedG * 0.4); expectedA = Math.floor(expectedA * 1.5); }
        else if (pos === "EXT") { expectedG = Math.floor(expectedG * 0.7); expectedA = Math.floor(expectedA * 1.2); }
        
        let extraG = Math.max(0, expectedG - gameState.goalsThisSeason);
        let extraA = Math.max(0, expectedA - gameState.assistsThisSeason);

        gameState.goals += extraG;
        gameState.assists += extraA;
        gameState.goalsThisSeason += extraG;
        gameState.assistsThisSeason += extraA;
        gameState.matches += simulatedMatches;

        let rChange = Math.random();
        let diff = 0;
        let changeType = "";

        if (rChange < 0.70) {
            diff = randomInt(-1, 2);
            changeType = "Nivel mantenido";
        } else if (rChange < 0.95) {
            if ((gameState.goalsThisSeason + gameState.assistsThisSeason) >= (expectedG + expectedA) * 0.7) {
                diff = randomInt(1, 4);
                changeType = "Buena temporada";
            } else {
                diff = randomInt(-3, -1);
                changeType = "Mala temporada";
            }
        } else {
            diff = randomInt(3, 6);
            changeType = "¡Sorpresa Élite!";
        }
        
        gameState.rating += diff;
        gameState.rating = Math.max(40, Math.min(99, gameState.rating));
        let sign = diff > 0 ? "+" : "";

        addLog(`--- Temp. ${gameState.season} | ${gameState.goalsThisSeason} Goles | ${gameState.assistsThisSeason} Asis. ---`, "system");
        addLog(`Evolución de fin de año: ${sign}${diff} GRL.`, "system");

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
            </div>
        `;
    } else {
        summaryHtml = `<div style="font-size:1.2rem; color:var(--text-muted)">Sin minutos esta temporada.</div>`;
    }

    showModalResult("Fin de la Temporada", summaryHtml, "Aquí tienes el balance de tu año.", endSeason);
}

function advanceNode() {
    DOM.modalOverlay.classList.add('hidden');
    gameState.currentTier++;
    saveState();
    updateUI();
    renderTree();
}

function endSeason() {
    DOM.modalOverlay.classList.add('hidden');
    gameState.season++;
    gameState.age++;
    
    if (gameState.age >= 45) {
        addLog("Has cumplido 45 años. Por reglamento médico y físico, te ves obligado a retirarte.", "system");
        setTimeout(() => {
            alert("¡Has cumplido 45 años! Tu cuerpo ya no aguanta el ritmo profesional. Es hora de colgar las botas y pasar a la historia.");
            retirePlayer();
        }, 500);
        return;
    }

    if (gameState.team !== "Agente Libre") {
        gameState.seasonsAtCurrentClub = (gameState.seasonsAtCurrentClub || 0) + 1;
        
        if (gameState.seasonsAtCurrentClub >= 3) {
            if (!gameState.upgradedClubs) gameState.upgradedClubs = {};
            let currentTier = getEffectiveTier(gameState.team);
            
            if (currentTier > 1) { 
                gameState.upgradedClubs[gameState.team] = (gameState.upgradedClubs[gameState.team] || 0) + 1;
                let newTier = currentTier - 1;
                
                addLog(`🌟 ¡LEYENDA DEL CLUB! Llevas 3 años aquí y el ${gameState.team} sube de categoría a Tier ${newTier}.`, "system");
                alert(`🌟 ¡LEALTAD PREMIADA!\n\nGracias a tu rendimiento liderando el proyecto durante 3 temporadas, el ${gameState.team} ha crecido como club.\n\n¡A partir de ahora son considerados un equipo de Tier ${newTier}!`);
            }
            gameState.seasonsAtCurrentClub = 0;
        }
    }

    gameState.matchesThisSeason = 0;
    gameState.goalsThisSeason = 0;
    gameState.assistsThisSeason = 0;

    generateDiamondTree();
    saveState();
    updateUI();
    renderTree();
}

// --- FUNCIÓN PARA EVENTOS ALEATORIOS ---
// --- FUNCIÓN PARA EVENTOS ALEATORIOS ---
function getRandomEventType() {
    let r = Math.random() * 100;
    if (r < 40) return 'match';         // 40% Partido
    if (r < 80) return 'training';      // 40% Entrenamiento (40+40=80)
    if (r < 90) return 'rest';          // 10% Descanso (80+10=90)
    return 'random';                    // 10% Evento aleatorio (hasta 100)
}

// --- GENERACIÓN DEL MAPA ---
function generateDiamondTree() {
    gameState.currentTier = 0;
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
    if (myTier <= 2 && !myEuro) {
        myEuro = myTier === 1 ? "Champions League" : "Europa League";
    }

    let wonLeague = Math.random() * 100 < pLeague;
    let wonCup = Math.random() * 100 < pCup;
    let wonEuro = myEuro && (Math.random() * 100 < pEurope);

    if (wonLeague) gameState.finalsReached.push("Liga");
    if (wonCup) gameState.finalsReached.push("Copa");
    if (wonEuro) gameState.finalsReached.push(myEuro);

    let hasFinals = gameState.finalsReached.length > 0;

    // AHORA EL ÁRBOL ES 100% ALEATORIO EXCEPTO LOS TRAMOS OBLIGATORIOS
    let t1 = [getRandomEventType(), getRandomEventType()];
    let t2 = [getRandomEventType(), getRandomEventType(), getRandomEventType()];
    // El tramo 3 mantiene su Mercado de Invierno obligatorio en el medio
    let t3 = [getRandomEventType(), 'transfer', getRandomEventType(), getRandomEventType()];
    let t4 = [getRandomEventType(), getRandomEventType(), getRandomEventType()];
    
    let t5 = hasFinals ? ['final_match', 'final_match'] : [getRandomEventType(), getRandomEventType()];

    const layout = [
        ['transfer'],                                       
        t1,                              
        t2,                     
        t3,      
        t4,                     
        t5,                           
        ['season_summary']                                
    ];

    let tree = [];
    layout.forEach((row, rIndex) => {
        let tierNodes = [];
        row.forEach((type, cIndex) => {
            tierNodes.push({ id: `t${rIndex}_n${cIndex}`, tier: rIndex, type: type, children: getChildrenIds(rIndex, cIndex, layout) });
        });
        tree.push(tierNodes);
    });
    
    gameState.seasonTree = tree;
    gameState.currentNodeId = tree[0][0].id; 
}

function getChildrenIds(r, c, layout) {
    if (r >= layout.length - 1) return [];
    let children = [];
    let nextRowLen = layout[r+1].length;
    let currRowLen = layout[r].length;

    if (nextRowLen > currRowLen) { children.push(`t${r+1}_n${c}`); children.push(`t${r+1}_n${c+1}`); }
    else if (nextRowLen < currRowLen) { if (c > 0) children.push(`t${r+1}_n${c-1}`); if (c < nextRowLen) children.push(`t${r+1}_n${c}`); }
    else { children.push(`t${r+1}_n${c}`); }
    return [...new Set(children)];
}

function renderTree() {
    DOM.nodesWrapper.innerHTML = '';
    
    gameState.seasonTree.forEach((tier) => {
        const rowDiv = document.createElement('div');
        rowDiv.className = 'tier-row';
        
        tier.forEach(node => {
            const nodeEl = document.createElement('div');
            nodeEl.className = 'event-node';
            nodeEl.id = node.id;
            nodeEl.innerHTML = EVENT_ICONS[node.type];
            
            // Asignación de nombres de eventos a las etiquetas
            let titleText = 'Evento';
            if (node.type === 'transfer') titleText = 'Mercado';
            else if (node.type === 'match') titleText = 'Partido';
            else if (node.type === 'training') titleText = 'Entrenamiento';
            else if (node.type === 'rest') titleText = 'Descanso';
            else if (node.type === 'random') titleText = 'Sorpresa';
            else if (node.type === 'season_summary') titleText = 'Resumen';
            else if (node.type === 'final_match') titleText = 'Final';

            nodeEl.setAttribute('data-title', titleText);
            
            if (node.type === 'final_match') {
                nodeEl.style.borderColor = "var(--danger-red)";
                nodeEl.style.boxShadow = "0 0 15px rgba(239,68,68,0.5)";
                
                const finalLabel = document.createElement('div');
                finalLabel.textContent = "FINAL";
                finalLabel.style.position = "absolute";
                finalLabel.style.top = "-22px";
                finalLabel.style.backgroundColor = "var(--danger-red)";
                finalLabel.style.color = "white";
                finalLabel.style.padding = "2px 8px";
                finalLabel.style.borderRadius = "4px";
                finalLabel.style.fontSize = "0.75rem";
                finalLabel.style.fontWeight = "bold";
                finalLabel.style.letterSpacing = "1px";
                nodeEl.appendChild(finalLabel);
            }

            if (node.tier < gameState.currentTier) {
                nodeEl.classList.add('completed');
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
    if (prevNode && prevNode.tier === gameState.currentTier - 1) {
        return prevNode.children.includes(nodeId);
    }
    return true;
}

function drawLines() {
    DOM.treeLines.innerHTML = '';
    const svgRect = DOM.treeLines.getBoundingClientRect();
    
    gameState.seasonTree.forEach(tier => {
        tier.forEach(node => {
            const el1 = document.getElementById(node.id);
            if (!el1) return;
            const rect1 = el1.getBoundingClientRect();
            
            const x1 = rect1.left - svgRect.left + (rect1.width / 2);
            const y1 = rect1.top - svgRect.top + (rect1.height / 2);

            node.children.forEach(childId => {
                const el2 = document.getElementById(childId);
                if (!el2) return;
                const rect2 = el2.getBoundingClientRect();
                
                const x2 = rect2.left - svgRect.left + (rect2.width / 2);
                const y2 = rect2.top - svgRect.top + (rect2.height / 2);

                const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', x1); line.setAttribute('y1', y1); line.setAttribute('x2', x2); line.setAttribute('y2', y2);
                line.classList.add('path-line');
                if (node.tier < gameState.currentTier && isPathTaken(node.id, childId)) line.classList.add('active');
                DOM.treeLines.appendChild(line);
            });
        });
    });
}

function isPathTaken(parentId, childId) {
    const childNode = findNode(childId);
    return childNode && childNode.tier < gameState.currentTier; 
}

function findNode(id) {
    for (let tier of gameState.seasonTree) {
        for (let node of tier) { if (node.id === id) return node; }
    }
    return null;
}

window.onload = init;