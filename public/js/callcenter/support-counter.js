document.addEventListener("DOMContentLoaded", () => {
  const counter =
    document.getElementById("supportWaitingCount");

  if (!counter) {
    return;
  }

  const updateSupportWaitingCount = async () => {
    try {
      const response = await fetch(
        "/api/call-center/support",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
          cache: "no-store",
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        return;
      }

      counter.textContent =
        Number(data.stats?.waitingCount || 0);
    } catch (error) {
      console.error(
        "SUPPORT COUNT ERROR:",
        error,
      );
    }
  };

  updateSupportWaitingCount();

  setInterval(
    updateSupportWaitingCount,
    2000,
  );
});