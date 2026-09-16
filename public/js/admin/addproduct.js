document.addEventListener("DOMContentLoaded", () => {
  const successMessage = document.getElementById("successMessage");

  if (!successMessage) {
    return;
  }

  setTimeout(() => {
    successMessage.style.opacity = "0";
    successMessage.style.transform = "translateY(-10px)";

    setTimeout(() => {
      successMessage.remove();
    }, 300);
  }, 7000);
});