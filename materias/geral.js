document.addEventListener("DOMContentLoaded", () => {

  const main = document.querySelector("main[data-materia]");
  if (!main) return;

  const materia = main.dataset.materia;

  const checkboxes = main.querySelectorAll("input[type='checkbox']");
  const progressFill = document.querySelector(".progress-fill");
  const progressText = document.querySelector(".progress-text");

  if (!checkboxes.length) return;

  const checksKey = `materia-${materia}-checks`;

  // carregar estado salvo
  let saved = [];

  try {
    saved = JSON.parse(localStorage.getItem(checksKey)) || [];
  } catch {
    saved = [];
  }

  checkboxes.forEach((cb, i) => {
    cb.checked = saved[i] === true;
  });

  function updateProgress() {

    const total = checkboxes.length;

    const done = [...checkboxes].filter(cb => cb.checked).length;

    const percent = Math.round((done / total) * 100);

    if (progressFill) {
      progressFill.style.width = percent + "%";
    }

    if (progressText) {
      progressText.textContent = percent + "%";
    }

    localStorage.setItem(
      checksKey,
      JSON.stringify([...checkboxes].map(cb => cb.checked))
    );

  }

  checkboxes.forEach(cb =>
    cb.addEventListener("change", updateProgress)
  );

  updateProgress();

});