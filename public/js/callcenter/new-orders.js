let previousOrdersCount = null;

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

    gainNode.gain.setValueAtTime(0.001, audioContext.currentTime + note.start);

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

    oscillator.stop(audioContext.currentTime + note.start + note.duration);
  });

  setTimeout(() => {
    audioContext.close();
  }, 1000);
}

async function updateNewOrdersCount() {
  try {
    const response = await fetch("/call-center/new-orders");

    const data = await response.json();

    const counter = document.getElementById("newOrdersCount");

    if (counter) {
      counter.textContent = data.count;

      if (Number(data.count) > 0) {
        counter.classList.add("has-new-orders");
      } else {
        counter.classList.remove("has-new-orders");
      }
    }

    // أول فحص فقط بدون صوت
    if (previousOrdersCount === null) {
      previousOrdersCount = Number(data.count);
      return;
    }

    // تشغيل الصوت فقط عند وصول طلب جديد
    if (Number(data.count) > previousOrdersCount) {
      console.log("NEW ORDER RECEIVED");

      playNewOrderSound();

      const alertBox = document.getElementById("newOrderAlert");

      if (alertBox) {
        alertBox.classList.add("show");

        alertBox.onclick = function () {
          if (data.latestOrderId) {
            window.location.href = `/call-center/orders/${data.latestOrderId}`;
          }
        };

        setTimeout(() => {
          alertBox.classList.remove("show");
        }, 5000);
      }
    }

    previousOrdersCount = Number(data.count);
  } catch (error) {
    console.error("NEW ORDERS COUNT ERROR:", error);
  }
}

updateNewOrdersCount();

setInterval(updateNewOrdersCount, 5000);
