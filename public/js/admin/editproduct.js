document.addEventListener("DOMContentLoaded", () => {
  const editForm = document.getElementById("editForm");
  const confirmModal = document.getElementById("confirmModal");
  const successMessage = document.getElementById("successMessage");

  function openConfirmModal(event) {
    event.preventDefault();
    confirmModal.style.display = "flex";
  }

  function closeConfirmModal() {
    confirmModal.style.display = "none";
  }

  function confirmEdit() {
    editForm.submit();
  }

  window.openConfirmModal = openConfirmModal;
  window.closeConfirmModal = closeConfirmModal;
  window.confirmEdit = confirmEdit;

  window.onclick = function (event) {
    if (event.target === confirmModal) {
      closeConfirmModal();
    }
  };

  if (successMessage) {
    setTimeout(() => {
      successMessage.style.opacity = "0";
      successMessage.style.transform = "translateY(-10px)";

      setTimeout(() => {
        successMessage.remove();
      }, 300);
    }, 7000);
  }
});