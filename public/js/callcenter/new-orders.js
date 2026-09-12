let previousOrdersCount = null;

let notifiedOrderIds = JSON.parse(
  localStorage.getItem("notifiedOrderIds") || "[]",
);

function playNewOrderSound() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;

  if (!AudioContext) {
    return;
  }

  const audioContext = new AudioContext();

  const notes = [
    { frequency: 880, start: 0, duration: 0.18 },
    { frequency: 1175, start: 0.2, duration: 0.18 },
    { frequency: 988, start: 0.4, duration: 0.3 },
  ];

  notes.forEach((note) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";

    oscillator.frequency.setValueAtTime(
      note.frequency,
      audioContext.currentTime + note.start,
    );

    gainNode.gain.setValueAtTime(
      0.001,
      audioContext.currentTime + note.start,
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.25,
      audioContext.currentTime + note.start + 0.02,
    );

    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + note.start + note.duration,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(audioContext.currentTime + note.start);

    oscillator.stop(
      audioContext.currentTime + note.start + note.duration,
    );
  });

  setTimeout(() => {
    audioContext.close();
  }, 1000);
}

async function updateNewOrdersCount() {
  try {
    const response = await fetch("/call-center/new-orders");

    const data = await response.json();

    console.log("NEW ORDERS DATA:", data);

    const counter = document.getElementById("newOrdersCount");

    if (counter) {
      counter.textContent = data.count;

      if (Number(data.count) > 0) {
        counter.classList.add("has-new-orders");
      } else {
        counter.classList.remove("has-new-orders");
      }
    }

    // أول فحص فقط بدون إشعار
    if (previousOrdersCount === null) {
      previousOrdersCount = Number(data.count);

      notifiedOrderIds = (data.orderIds || []).map(Number);

      localStorage.setItem(
        "notifiedOrderIds",
        JSON.stringify(notifiedOrderIds),
      );

      console.log("INITIAL ORDER IDS:", notifiedOrderIds);

      return;
    }

    // البحث عن الطلبات الجديدة
    const newOrderIds = (data.orderIds || [])
      .map(Number)
      .filter((orderId) => !notifiedOrderIds.includes(orderId));

    console.log("NEW ORDER IDS:", newOrderIds);

    if (newOrderIds.length > 0) {
      console.log("NEW ORDERS RECEIVED:", newOrderIds);

      // تشغيل الصوت
      playNewOrderSound();

      // إظهار الإشعار
      const alertBox = document.getElementById("newOrderAlert");

      if (alertBox) {
        alertBox.classList.add("show");

        setTimeout(() => {
          alertBox.classList.remove("show");
        }, 5000);
      }

      // حفظ الطلبات التي تم التنبيه عنها
      notifiedOrderIds = [
        ...notifiedOrderIds,
        ...newOrderIds,
      ];

      localStorage.setItem(
        "notifiedOrderIds",
        JSON.stringify(notifiedOrderIds),
      );
    }

    previousOrdersCount = Number(data.count);
  } catch (error) {
    console.error("NEW ORDERS COUNT ERROR:", error);
  }
}

updateNewOrdersCount();

setInterval(updateNewOrdersCount, 5000);