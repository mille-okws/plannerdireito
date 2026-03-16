document.addEventListener("DOMContentLoaded", () => {
    /* ================== CHAVES STORAGE ================== */
    const CONFIG_KEY = "cycle-config";
    const DIST_KEY = "cycle-distribution";
    const PROGRESS_KEY = "daily-progress";
    const HISTORY_KEY = "study-history";

    /* ================== CARREGAMENTO DE DADOS ================== */
    const config = JSON.parse(localStorage.getItem(CONFIG_KEY)) || { dailyHours: 0, activeDays: [] };
    const distribution = JSON.parse(localStorage.getItem(DIST_KEY)) || {};
    const dailyProgress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
    const history = JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];

    const subjectIds = Object.keys(distribution);
    const subjectNames = subjectIds.map(id => id.replace(/-/g, ' ').toUpperCase());

    // Se não houver dados, avisa o usuário
    if (subjectIds.length === 0) {
        document.querySelector(".container").innerHTML = `
            <header><h1>Estatísticas</h1><p>Configure o seu ciclo para ver os dados.</p></header>
        `;
        return;
    }

    /* ================== MÉTRICAS DE TOPO ================== */
    const weeklyGoal = config.dailyHours * config.activeDays.length;
    
    // Hoje
    const todayDoneMins = subjectIds.map(id => Math.floor((dailyProgress[id] || 0) / 60));
    const totalMinsToday = todayDoneMins.reduce((a, b) => a + b, 0);
    const todayTargetMins = subjectIds.map(id => Math.round((config.dailyHours * 60) * (distribution[id] / 100)));

    document.getElementById("total-today").textContent = (totalMinsToday / 60).toFixed(1) + "h";
    document.getElementById("weekly-goal-hrs").textContent = weeklyGoal + "h";
    
    const globalTargetMins = config.dailyHours * 60;
    const efficiency = globalTargetMins > 0 ? Math.min(100, (totalMinsToday / globalTargetMins) * 100) : 0;
    document.getElementById("efficiency-pc").textContent = Math.round(efficiency) + "%";

    /* ================== CONFIGURAÇÕES GLOBAIS CHART.JS ================== */
    Chart.defaults.color = '#888';
    Chart.defaults.font.family = "'Inter', sans-serif";
    const neonGreen = '#00ff9d';
    const neonGlow = 'rgba(0, 255, 157, 0.2)';

    /* ================== GRÁFICO 1: REALIZADO VS META (BARRAS) ================== */
    new Chart(document.getElementById('chart-daily'), {
        type: 'bar',
        data: {
            labels: subjectNames,
            datasets: [
                { 
                    label: 'Meta (min)', 
                    data: todayTargetMins, 
                    backgroundColor: '#222',
                    borderRadius: 4
                },
                { 
                    label: 'Realizado (min)', 
                    data: todayDoneMins, 
                    backgroundColor: neonGreen,
                    boxShadow: '0 0 10px ' + neonGlow,
                    borderRadius: 4
                }
            ]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            plugins: { 
                legend: { labels: { color: '#fff', font: { size: 10 } } } 
            },
            scales: {
                x: { grid: { color: '#111' }, ticks: { color: '#666' } },
                y: { grid: { display: false }, ticks: { color: '#aaa' } }
            }
        }
    });

   /* ================== GRÁFICO 2: EQUILÍBRIO DO CICLO (RADAR) ================== */
    
    // Calculamos a porcentagem de conclusão de cada matéria para o gráfico radar
    // Se você atingiu 100% da meta em todas, o radar vira um círculo perfeito.
    const radarData = subjectIds.map((id, i) => {
        const target = todayTargetMins[i];
        const done = todayDoneMins[i];
        return target > 0 ? Math.min(110, (done / target) * 100) : 0; 
    });

    const ctxRadar = document.getElementById('chart-radar');
    
    new Chart(ctxRadar, {
        type: 'radar',
        data: {
            labels: subjectNames, // Cada ponta do radar é uma matéria
            datasets: [{
                label: '% de Batimento da Meta',
                data: radarData,
                backgroundColor: 'rgba(0, 255, 157, 0.2)', // neonGlow
                borderColor: '#00ff9d',                 // neonGreen
                borderWidth: 2,
                pointBackgroundColor: '#00ff9d',
                pointBorderColor: '#000',
                pointHoverBackgroundColor: '#fff',
                pointRadius: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                r: {
                    // Configurações do fundo do radar
                    angleLines: { color: '#222' },
                    grid: { color: '#222' },
                    pointLabels: { 
                        color: '#888', 
                        font: { size: 10, family: 'Orbitron' } 
                    },
                    ticks: {
                        display: false, // Remove os números 20, 40, 60... do meio
                        stepSize: 20,
                        max: 100
                    },
                    suggestedMin: 0,
                    suggestedMax: 100
                }
            }
        }
    });
    /* ================== TABELA DETALHADA ================== */
    const tableContainer = document.getElementById("table-stats-detailed");
    let tableHtml = `
        <table>
            <thead>
                <tr>
                    <th>Matéria</th>
                    <th>Peso</th>
                    <th>Meta Diária</th>
                    <th>Hoje</th>
                    <th>Status</th>
                </tr>
            </thead>
            <tbody>
    `;

    subjectIds.forEach((id, i) => {
        const weight = distribution[id];
        const target = todayTargetMins[i];
        const done = todayDoneMins[i];
        const diff = done - target;
        const statusColor = diff >= 0 ? neonGreen : '#ff4444';

        tableHtml += `
            <tr>
                <td>${subjectNames[i]}</td>
                <td>${weight}%</td>
                <td>${target}m</td>
                <td style="color: #fff">${done}m</td>
                <td style="color: ${statusColor}">${diff >= 0 ? '✓' : diff + 'm'}</td>
            </tr>
        `;
    });

    tableHtml += `</tbody></table>`;
    tableContainer.innerHTML = tableHtml;
});