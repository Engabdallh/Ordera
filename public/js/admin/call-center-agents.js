document.addEventListener("DOMContentLoaded", () => {
  const successMessage = document.getElementById("successMessage");
  const errorMessage = document.getElementById("errorMessage");

  function hideMessage(message) {
    if (!message) {
      return;
    }

    setTimeout(() => {
      message.style.opacity = "0";
      message.style.transform = "translateY(-10px)";

      setTimeout(() => {
        message.remove();
      }, 300);
    }, 7000);
  }

  hideMessage(successMessage);
  hideMessage(errorMessage);
});

function togglePassword(inputId, button) {
  const input = document.getElementById(inputId);

  if (input.type === "password") {
    input.type = "text";
    button.textContent = "🙈";
  } else {
    input.type = "password";
    button.textContent = "👁";
  }
}