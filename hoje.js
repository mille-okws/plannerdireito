document.addEventListener("DOMContentLoaded", () => {
    /* ================== CHAVES STORAGE ================== */
    const CONFIG_KEY = "cycle-config";
    const DIST_KEY = "cycle-distribution";
    const PROGRESS_KEY = "daily-progress";
    const ACTIVE_TIMER_KEY = "active-timer";
    const LAST_DATE_KEY = "last-access-date";
    const HISTORY_KEY = "study-history";

    /* ================== ELEMENTOS DO DOM ================== */
    const dailyTargetEl = document.getElementById("daily-target");
    const dailyDoneEl = document.getElementById("daily-done");
    const progressBarEl = document.getElementById("daily-progress-bar");
    const dateDisplayEl = document.getElementById("current-date-display");
    const subjectsListEl = document.getElementById("today-subjects-list");
    const activeSubjectTitleEl = document.getElementById("active-subject-title");
    const mainTimerEl = document.getElementById("main-timer");
    const timerSectionEl = document.querySelector(".timer-section"); // Para efeito visual

    const btnStart = document.getElementById("btn-start");
    const btnPause = document.getElementById("btn-pause");
    const btnStop = document.getElementById("btn-stop");
    const btnClear = document.getElementById("btn-clear-logs");
    const logListEl = document.getElementById("session-log-list");

    /* ================== ESTADO INICIAL ================== */
    let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || { dailyHours: 0, activeDays: [] };
    let distribution = JSON.parse(localStorage.getItem(DIST_KEY)) || {};
    let dailyProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};

    let activeSubjectId = null;
    let timerInterval = null;
    let timerState = { running: false, startTime: null, accumulated: 0 };

    /* ================== INICIALIZAÇÃO ================== */
    function init() {
        const now = new Date();
        const todayStr = now.toLocaleDateString("pt-BR");
        const lastDate = localStorage.getItem(LAST_DATE_KEY);

        if (lastDate && lastDate !== todayStr) {
            const lastDayProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
            if (Object.keys(lastDayProgress).length > 0) {
                let history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
                history.push({
                    date: lastDate,
                    data: lastDayProgress,
                    totalMinutes: Object.values(lastDayProgress).reduce((a, b) => a + Math.floor(b / 60), 0)
                });
                localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
            }
            localStorage.removeItem(PROGRESS_KEY);
            localStorage.removeItem(ACTIVE_TIMER_KEY);
            dailyProgress = {};
        }
        localStorage.setItem(LAST_DATE_KEY, todayStr);

        dateDisplayEl.textContent = now.toLocaleDateString("pt-BR", {
            weekday: "long", day: "numeric", month: "long", year: "numeric"
        }).toUpperCase();

        if (Object.keys(distribution).length === 0) {
            subjectsListEl.innerHTML = "<p class='empty-log'>NENHUMA MATÉRIA CONFIGURADA NO CICLO.</p>";
            return;
        }

        restoreActiveTimer();
        renderTodaySubjects();
        updateGlobalStats();
        updateTimerDisplay();
    }

    /* ================== LÓGICA DO TEMPO ================== */
    function getElapsedSeconds() {
        if (!timerState.running || !timerState.startTime) return timerState.accumulated;
        return timerState.accumulated + Math.floor((Date.now() - timerState.startTime) / 1000);
    }

    function updateTimerDisplay() {
        const total = getElapsedSeconds();
        const h = Math.floor(total / 3600).toString().padStart(2, "0");
        const m = Math.floor((total % 3600) / 60).toString().padStart(2, "0");
        const s = (total % 60).toString().padStart(2, "0");
        mainTimerEl.textContent = `${h}:${m}:${s}`;
        
        // Efeito visual de pulso no timer quando rodando
        if (timerState.running) {
            mainTimerEl.style.opacity = (Math.sin(Date.now() / 500) * 0.2 + 0.8).toFixed(2);
        } else {
            mainTimerEl.style.opacity = "1";
        }
    }

    function updateGlobalStats() {
        const targetSeconds = config.dailyHours * 3600;
        const doneSeconds = Object.values(dailyProgress).reduce((a, b) => a + b, 0);
        const h = Math.floor(doneSeconds / 3600);
        const m = Math.floor((doneSeconds % 3600) / 60);

        if (dailyTargetEl) dailyTargetEl.textContent = `${config.dailyHours}H`;
        if (dailyDoneEl) dailyDoneEl.textContent = `${h}H ${m}M`;

        const percent = targetSeconds > 0 ? Math.min(100, (doneSeconds / targetSeconds) * 100) : 0;
        if (progressBarEl) progressBarEl.style.width = `${percent}%`;
    }

    function renderTodaySubjects() {
        subjectsListEl.innerHTML = "";
        Object.keys(distribution).forEach(id => {
            const weight = distribution[id];
            const targetMins = (config.dailyHours * 60) * (weight / 100);
            const doneMins = Math.floor((dailyProgress[id] || 0) / 60);
            const progress = targetMins > 0 ? Math.min(100, (doneMins / targetMins) * 100) : 0;

            const card = document.createElement("div");
            card.className = `subject-card ${activeSubjectId === id ? "active" : ""}`;
            card.innerHTML = `
                <div class="subject-info">
                    <strong>${id.replace(/-/g, ' ').toUpperCase()}</strong>
                    <div class="progress-mini">
                        <div class="progress-mini-fill" style="width: ${progress}%"></div>
                    </div>
                    <small>${doneMins}M DE ${Math.round(targetMins)}M (${Math.round(progress)}%)</small>
                </div>
                <button class="btn-focus">${activeSubjectId === id ? 'EM FOCO' : 'FOCAR'}</button>
            `;
            card.querySelector("button").onclick = () => selectSubject(id);
            subjectsListEl.appendChild(card);
        });
    }

    function selectSubject(id) {
        if (timerState.running) {
            if (!confirm("ISSO PARARÁ O ESTUDO ATUAL. CONTINUAR?")) return;
            stopTimer();
        }
        activeSubjectId = id;
        activeSubjectTitleEl.textContent = `FOCO: ${id.replace(/-/g, ' ').toUpperCase()}`;
        timerState = { running: false, startTime: null, accumulated: 0 };
        updateTimerDisplay();
        renderTodaySubjects();
        
        btnStart.style.display = "inline-block";
        btnPause.style.display = "none";
        btnStop.style.display = "none";
    }

    /* ================== CONTROLES ================== */
    btnStart.onclick = () => {
        if (!activeSubjectId) {
            alert("ESCOLHA UMA MATÉRIA PRIMEIRO, DOCE PESQUISADORA.");
            return;
        }
        timerState.running = true;
        timerState.startTime = Date.now();
        btnStart.style.display = "none";
        btnPause.style.display = "inline-block";
        btnStop.style.display = "inline-block";
        if (!timerInterval) timerInterval = setInterval(updateTimerDisplay, 1000);
    };

    btnPause.onclick = () => {
        timerState.accumulated = getElapsedSeconds();
        timerState.running = false;
        timerState.startTime = null;
        btnStart.style.display = "inline-block";
        btnPause.style.display = "none";
    };

    btnStop.onclick = stopTimer;

    function stopTimer() {
        const finalElapsed = getElapsedSeconds();
        clearInterval(timerInterval);
        timerInterval = null;

        if (activeSubjectId && finalElapsed > 0) {
            dailyProgress[activeSubjectId] = (dailyProgress[activeSubjectId] || 0) + finalElapsed;
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(dailyProgress));
            addLog(activeSubjectId, finalElapsed);
        }

        localStorage.removeItem(ACTIVE_TIMER_KEY);
        timerState = { running: false, startTime: null, accumulated: 0 };
        activeSubjectId = null;
        activeSubjectTitleEl.textContent = "SELECIONE UMA MATÉRIA";
        
        updateTimerDisplay();
        updateGlobalStats();
        renderTodaySubjects();
        
        btnStart.style.display = "inline-block";
        btnPause.style.display = "none";
        btnStop.style.display = "none";
    }

    function addLog(id, secs) {
        const empty = logListEl.querySelector(".empty-log");
        if (empty) empty.remove();
        const div = document.createElement("div");
        div.className = "log-item";
        div.style.marginBottom = "10px";
        div.innerHTML = `<span style="font-style:italic;">${id.replace(/-/g, ' ').toUpperCase()}</span> <strong style="color:var(--accent-cozy)">+${Math.floor(secs / 60)}M</strong>`;
        logListEl.prepend(div);
    }

    btnClear.onclick = () => {
        if (confirm("DESEJA APAGAR OS REGISTROS DE HOJE E RECOMEÇAR?")) {
            localStorage.removeItem(PROGRESS_KEY);
            localStorage.removeItem(ACTIVE_TIMER_KEY);
            location.reload();
        }
    };

    function restoreActiveTimer() {
        const saved = JSON.parse(localStorage.getItem(ACTIVE_TIMER_KEY));
        if (saved) {
            activeSubjectId = saved.id;
            timerState.accumulated = saved.accumulated;
            timerState.startTime = saved.startTime;
            timerState.running = saved.running;
            
            if (timerState.running) {
                btnStart.style.display = "none";
                btnPause.style.display = "inline-block";
                btnStop.style.display = "inline-block";
                timerInterval = setInterval(updateTimerDisplay, 1000);
            }
            activeSubjectTitleEl.textContent = `FOCO: ${activeSubjectId.replace(/-/g, ' ').toUpperCase()}`;
        }
    }

    window.addEventListener("beforeunload", () => {
        if (activeSubjectId) {
            localStorage.setItem(ACTIVE_TIMER_KEY, JSON.stringify({
                id: activeSubjectId,
                accumulated: getElapsedSeconds(),
                startTime: timerState.running ? timerState.startTime : null,
                running: timerState.running
            }));
        }
    });

    init();
});