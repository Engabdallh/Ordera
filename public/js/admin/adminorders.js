const cycleSelect = document.getElementById("cycle");
const deleteCycleForm = document.getElementById("deleteCycleForm");
const deleteCycleBtn = document.getElementById("deleteCycleBtn");

function updateDeleteCycleButton() {
  if (cycleSelect.value) {
    deleteCycleForm.action = `/admin/cycles/${cycleSelect.value}/delete`;
    deleteCycleBtn.disabled = false;
  } else {
    deleteCycleForm.action = "";
    deleteCycleBtn.disabled = true;
  }
}

if (cycleSelect && deleteCycleForm && deleteCycleBtn) {
  updateDeleteCycleButton();

  cycleSelect.addEventListener("change", updateDeleteCycleButton);
}