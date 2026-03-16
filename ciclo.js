document.addEventListener("DOMContentLoaded", () => {

  /* ================== CONSTANTES / DADOS ================== */
  const SUBJECTS = [
    { id: "direito-penal", name: "Direito Penal" },
    { id: "direito-constitucional", name: "Direito Constitucional" },
    { id: "direito-civil", name: "Direito Civil" },
    { id: "direito-processual-civil", name: "Direito Processual Civil" },
    { id: "direito-processual-penal", name: "Direito Processual Penal" },
    { id: "direito-administrativo", name: "Direito Administrativo" },
  ];

  const CONFIG_KEY = "cycle-config";
  const DIST_KEY = "cycle-distribution";
  const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  /* ================== ELEMENTOS DO DOM ================== */
  const dailyInput = document.getElementById("daily-hours");
  const daysButtons = document.querySelectorAll(".weekdays button");
  const subjectsContainer = document.getElementById("cycle-subjects");
  const weekPreview = document.getElementById("week-preview");

  // Elementos do Header/Resumo
  const hoursDayEl = document.getElementById("hours-per-day");
  const hoursWeekEl = document.getElementById("hours-per-week");
  const percentUsedEl = document.getElementById("percent-used");
  const percentBarEl = document.getElementById("percent-bar");
  const cycleEndEl = document.getElementById("cycle-end");

  // Botões de Ação
  const saveBtn = document.getElementById("save-cycle");
  const resetBtn = document.getElementById("reset-cycle");

  /* ================== ESTADO (DATA) ================== */
  let config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || {
    dailyHours: 6,
    activeDays: [1, 2, 3, 4, 5] 
  };

  let distribution = JSON.parse(localStorage.getItem(DIST_KEY)) || {};

  /* ================== FUNÇÕES DE APOIO ================== */
  function getWeeklyHours() {
    return config.dailyHours * config.activeDays.length;
  }

  function getTotalPercentUsed() {
    return Object.values(distribution).reduce((a, b) => a + b, 0);
  }

  function getCycleEndDate() {
    const today = new Date();
    const end = new Date(today);
    end.setDate(today.getDate() + 7);
    return end.toLocaleDateString("pt-BR");
  }

  function saveToLocalStorage() {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
    localStorage.setItem(DIST_KEY, JSON.stringify(distribution));
  }

  /* ================== RENDERIZAÇÃO ================== */

  function updateUI() {
    const totalPercent = getTotalPercentUsed();
    const weeklyHrs = getWeeklyHours();

    // Atualiza Resumo no Topo
    if (hoursDayEl) hoursDayEl.textContent = config.dailyHours;
    if (hoursWeekEl) hoursWeekEl.textContent = weeklyHrs;
    if (percentUsedEl) percentUsedEl.textContent = `${totalPercent}%`;
    if (cycleEndEl) cycleEndEl.textContent = getCycleEndDate();
    
    // Atualiza Barra de Progresso
    if (percentBarEl) {
      percentBarEl.style.width = `${totalPercent}%`;
      percentBarEl.style.backgroundColor = totalPercent > 100 ? "#e74c3c" : "#2ecc71";
    }

    renderSubjects(weeklyHrs);
    renderWeekPreview();
  }

  function renderSubjects(weeklyHrs) {
    if (!subjectsContainer) return;
    subjectsContainer.innerHTML = "";

    SUBJECTS.forEach(subject => {
      const percent = distribution[subject.id] || 0;
      
      // CONVERSÃO PARA HORAS INTEIRAS (Math.round)
      const hours = Math.round((weeklyHrs * percent) / 100);

      const row = document.createElement("div");
      row.className = "subject-row";
      row.innerHTML = `
        <span class="subject-name">${subject.name}</span>
        <div class="percent-controls">
          <button class="btn-minus" type="button">−</button>
          <span class="percent-value">${percent}%</span>
          <button class="btn-plus" type="button">+</button>
        </div>
        <span class="subject-hours">${hours}h/sem</span>
      `;

      // Eventos dos botões +/-
      row.querySelector(".btn-minus").onclick = () => adjustPercent(subject.id, -5);
      row.querySelector(".btn-plus").onclick = () => adjustPercent(subject.id, 5);

      subjectsContainer.appendChild(row);
    });
  }

  function renderWeekPreview() {
    if (!weekPreview) return;
    weekPreview.innerHTML = "";

    // Ordenar dias cronologicamente
    const sortedDays = [...config.activeDays].sort((a, b) => a - b);

    sortedDays.forEach(day => {
      const col = document.createElement("div");
      col.className = "day-column";
      col.innerHTML = `
        <strong>${DAYS[day]}</strong>
        <span>${config.dailyHours}h</span>
      `;
      weekPreview.appendChild(col);
    });
  }

  /* ================== LÓGICA DE AJUSTE ================== */
  function adjustPercent(subjectId, delta) {
    const current = distribution[subjectId] || 0;
    const totalUsed = getTotalPercentUsed();
    
    let next = current + delta;
    
    // Validações de limite
    if (next < 0) next = 0;
    if (totalUsed - current + next > 100) {
        alert("O total não pode ultrapassar 100%");
        return;
    }

    if (next === 0) delete distribution[subjectId];
    else distribution[subjectId] = next;

    saveToLocalStorage();
    updateUI();
  }

  /* ================== EVENTOS ================== */

  // Input de horas
  if (dailyInput) {
    dailyInput.value = config.dailyHours;
    dailyInput.onchange = () => {
      config.dailyHours = Math.max(1, Number(dailyInput.value));
      saveToLocalStorage();
      updateUI();
    };
  }

  // Botões dos dias da semana
  daysButtons.forEach(btn => {
    const day = Number(btn.dataset.day);
    
    btn.classList.toggle("active", config.activeDays.includes(day));

    btn.onclick = () => {
      if (config.activeDays.includes(day)) {
        if (config.activeDays.length > 1) { // Manter pelo menos 1 dia
          config.activeDays = config.activeDays.filter(d => d !== day);
        }
      } else {
        config.activeDays.push(day);
      }

      btn.classList.toggle("active", config.activeDays.includes(day));
      saveToLocalStorage();
      updateUI();
    };
  });

  // Botões de Salvar e Reset
  if (saveBtn) {
    saveBtn.onclick = () => {
      saveToLocalStorage();
      alert("Ciclo guardado com sucesso!");
    };
  }

  if (resetBtn) {
    resetBtn.onclick = () => {
      if (!confirm("Deseja limpar toda a distribuição do ciclo?")) return;
      distribution = {};
      saveToLocalStorage();
      updateUI();
    };
  }

  /* ================== INIT ================== */
  updateUI();
});