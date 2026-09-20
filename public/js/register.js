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
// =========================================
// CONFIRM PASSWORD
// التحقق من تطابق كلمة السر
// =========================================

document.addEventListener(
  "DOMContentLoaded",
  () => {
    const registerForm =
      document.querySelector(
        ".register-form",
      );

    const password =
      document.getElementById(
        "password",
      );

    const confirmPassword =
      document.getElementById(
        "confirmPassword",
      );

    if (
      !registerForm ||
      !password ||
      !confirmPassword
    ) {
      return;
    }

    const checkPasswords = () => {
      if (
        !confirmPassword.value
      ) {
        confirmPassword.setCustomValidity(
          "",
        );

        return;
      }

      if (
        password.value !==
        confirmPassword.value
      ) {
        confirmPassword.setCustomValidity(
          "كلمتا السر غير متطابقتين",
        );
      } else {
        confirmPassword.setCustomValidity(
          "",
        );
      }
    };

    password.addEventListener(
      "input",
      checkPasswords,
    );

    confirmPassword.addEventListener(
      "input",
      checkPasswords,
    );

    registerForm.addEventListener(
      "submit",
      (event) => {
        checkPasswords();

        if (
          !registerForm.checkValidity()
        ) {
          event.preventDefault();

          confirmPassword.reportValidity();
        }
      },
    );
  },
);