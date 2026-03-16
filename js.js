// js.js — SCRIPT DEFINITIVO (BARRAS HORIZONTAIS)

document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".card");
  if (!cards.length) return;

  let soma = 0;
  let materiasValidas = 0;

  cards.forEach(card => {
    const materia = card.dataset.materia;
    if (!materia) return;

    // valor salvo pela página da matéria (0–100)
    const percent = Number(localStorage.getItem(`materia-${materia}-percent`)) || 0;

    const fill = card.querySelector(".progress-fill");
    const text = card.querySelector(".progress-text");

    if (fill) {
      fill.style.width = `${percent}%`;
    }
    if (text) {
      text.textContent = `${percent}%`;
    }

    soma += percent;
    materiasValidas++;
  });

  // progresso geral
  if (!materiasValidas) return;

  const geral = Math.round(soma / materiasValidas);
  const globalFill = document.getElementById("global-progress-fill");

  if (globalFill) {
    globalFill.style.width = `${geral}%`;
  }
  const globalText = document.querySelector(".header-top .subtitle");
  if (globalText) {
    globalText.textContent = `progresso geral: ${geral}%`;
  }
});
