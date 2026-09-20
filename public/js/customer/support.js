document.addEventListener("DOMContentLoaded", () => {
  const startConversationBtn = document.getElementById("startConversationBtn");

  const supportWelcome = document.getElementById("supportWelcome");

  const waitingArea = document.getElementById("waitingArea");

  const chatArea = document.getElementById("chatArea");

  const closedArea = document.getElementById("closedArea");

  const messagesContainer = document.getElementById("messages");

  const messageForm = document.getElementById("messageForm");

  const messageInput = document.getElementById("messageInput");

  const sendBtn = document.getElementById("sendBtn");

  const conversationStatus = document.getElementById("conversationStatus");

  const statusText = document.getElementById("statusText");

  const stars = document.querySelectorAll("#stars button");

  const selectedRatingText = document.getElementById("selectedRatingText");

  const ratingComment = document.getElementById("ratingComment");

  const submitRatingBtn = document.getElementById("submitRatingBtn");

  const newConversationBtn = document.getElementById("newConversationBtn");

  const cancelConversationBtn = document.getElementById(
    "cancelConversationBtn",
  );

  let conversationId = null;

  let selectedRating = 0;

  let pollingTimer = null;

  let lastMessagesHash = "";

  // =========================================
  // الوقت
  // =========================================

  const formatTime = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("ar-JO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // =========================================
  // حالة المحادثة
  // =========================================

  const updateStatus = (status) => {
    if (!conversationStatus || !statusText) {
      return;
    }

    conversationStatus.classList.remove("waiting", "active", "closed");

    if (status === "بانتظار الكول سنتر") {
      conversationStatus.classList.add("waiting");

      statusText.textContent = "🟡 بانتظار رد الكول سنتر";
    } else if (status === "بانتظار العميل") {
      conversationStatus.classList.add("active");

      statusText.textContent = "🟢 بانتظار رسالتك";
    } else if (status === "مغلقة") {
      conversationStatus.classList.add("closed");

      statusText.textContent = "🔒 تم إنهاء المحادثة";
    } else {
      conversationStatus.classList.add("waiting");

      statusText.textContent = "🟡 بانتظار رد الكول سنتر";
    }
  };

  // =========================================
  // عرض الواجهات
  // =========================================

  const showWelcome = () => {
    supportWelcome?.classList.remove("hidden");
    waitingArea?.classList.add("hidden");
    chatArea?.classList.add("hidden");
    closedArea?.classList.add("hidden");
  };

  const showWaiting = () => {
    supportWelcome?.classList.add("hidden");
    waitingArea?.classList.remove("hidden");
    chatArea?.classList.add("hidden");
    closedArea?.classList.add("hidden");

    updateStatus("بانتظار الكول سنتر");
  };

  const showChat = () => {
    supportWelcome?.classList.add("hidden");
    waitingArea?.classList.add("hidden");
    chatArea?.classList.remove("hidden");
    closedArea?.classList.add("hidden");
  };

  const showClosed = (conversation) => {
    supportWelcome?.classList.add("hidden");
    waitingArea?.classList.add("hidden");
    chatArea?.classList.add("hidden");
    closedArea?.classList.remove("hidden");

    updateStatus("مغلقة");

    if (
      conversation?.rating &&
      selectedRatingText &&
      ratingComment &&
      submitRatingBtn
    ) {
      selectedRatingText.textContent = `تم إرسال تقييمك: ${conversation.rating} من 5 ⭐`;

      stars.forEach((star) => {
        const value = Number(star.dataset.rating);

        star.classList.toggle("selected", value <= Number(conversation.rating));

        star.disabled = true;
        star.style.cursor = "default";
      });

      ratingComment.value = conversation.rating_comment || "";

      ratingComment.disabled = true;

      submitRatingBtn.disabled = true;

      submitRatingBtn.textContent = "تم إرسال التقييم ✓";
    }
  };

  // =========================================
  // عرض الرسائل
  // =========================================

  const renderMessages = (messages) => {
    if (!messagesContainer) {
      return;
    }

    const safeMessages = Array.isArray(messages) ? messages : [];

    const hash = safeMessages
      .map((message) => {
        return [
          message.id,
          message.sender_role,
          message.message,
          message.created_at,
        ].join("|");
      })
      .join("||");

    if (hash === lastMessagesHash) {
      return;
    }

    lastMessagesHash = hash;

    messagesContainer.innerHTML = "";

    if (safeMessages.length === 0) {
      const empty = document.createElement("div");

      empty.className = "empty-messages";

      empty.textContent = "لم يتم إرسال أي رسائل بعد. ابدأ المحادثة.";

      empty.style.textAlign = "center";
      empty.style.color = "#777";
      empty.style.padding = "40px 10px";

      messagesContainer.appendChild(empty);

      return;
    }

    safeMessages.forEach((message) => {
      const wrapper = document.createElement("div");

      wrapper.className = `message ${message.sender_role}`;

      const senderName = document.createElement("div");

      senderName.className = "message-sender-name";

      senderName.textContent =
        message.sender_role === "call_center"
          ? message.sender_name || "الكول سنتر"
          : message.sender_name || "أنت";

      const text = document.createElement("div");

      text.className = "message-text";

      text.textContent = String(message.message ?? "");

      const meta = document.createElement("div");

      meta.className = "message-meta";

      meta.textContent = formatTime(message.created_at);

      wrapper.appendChild(senderName);
      wrapper.appendChild(text);
      wrapper.appendChild(meta);

      messagesContainer.appendChild(wrapper);
    });

    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  // =========================================
  // فحص المحادثة الموجودة
  // لا ينشئ محادثة
  // =========================================

  const initialize = async () => {
    try {
      const response = await fetch("/api/support/conversation", {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر فحص المحادثة");
      }

      // لا توجد محادثة
      if (!data.conversation) {
        conversationId = null;

        showWelcome();

        updateStatus(null);

        return;
      }

      conversationId = data.conversation.id;

      // المحادثة مغلقة
      if (data.conversation.status === "مغلقة") {
        showClosed(data.conversation);

        return;
      }

      // لا يوجد موظف مستلم حتى الآن
      if (!data.conversation.assigned_agent_id) {
        showWaiting();
      } else {
        showChat();
      }

      await loadMessages();

      startPolling();
    } catch (error) {
      console.error("SUPPORT INITIALIZE ERROR:", error);

      conversationId = null;

      showWelcome();

      updateStatus(null);
    }
  };

  // =========================================
  // بدء المحادثة الأولى
  // =========================================

  const startConversation = async () => {
    if (conversationId) {
      await loadMessages();

      startPolling();

      return;
    }

    if (!startConversationBtn) {
      return;
    }

    startConversationBtn.disabled = true;

    startConversationBtn.textContent = "جاري فتح المحادثة...";

    try {
      const response = await fetch("/api/support/conversation", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر بدء المحادثة");
      }

      conversationId = data.conversation.id;

      lastMessagesHash = "";

      showWaiting();

      updateStatus(data.conversation.status);

      await loadMessages();

      startPolling();
    } catch (error) {
      console.error("START SUPPORT ERROR:", error);

      alert(error.message || "حدث خطأ أثناء بدء المحادثة");

      startConversationBtn.disabled = false;

      startConversationBtn.textContent = "بدء المحادثة";
    }
  };

  // =========================================
  // جلب الرسائل + معرفة هل الموظف استلمها
  // =========================================

  const loadMessages = async () => {
    if (!conversationId) {
      return;
    }

    try {
      const response = await fetch(
        `/api/support/conversation/${conversationId}/messages`,
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
        throw new Error(data.message || "تعذر تحميل الرسائل");
      }

      updateStatus(data.conversation.status);

      renderMessages(data.messages);

      // =========================================
      // المحادثة مغلقة
      // =========================================

      if (data.conversation.status === "مغلقة") {
        showClosed(data.conversation);

        stopPolling();

        return;
      }

      // =========================================
      // لا يوجد موظف مستلم
      // =========================================

      if (!data.conversation.assigned_agent_id) {
        showWaiting();

        return;
      }

      // =========================================
      // يوجد موظف مستلم
      // =========================================

      showChat();
    } catch (error) {
      console.error("LOAD SUPPORT MESSAGES ERROR:", error);
    }
  };

  // =========================================
  // زر بدء المحادثة الأولى
  // =========================================

  if (startConversationBtn) {
    startConversationBtn.addEventListener("click", startConversation);
  }

  // =========================================
  // إرسال رسالة
  // =========================================

  if (messageForm) {
    messageForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!conversationId) {
        return;
      }

      const message = messageInput.value.trim();

      if (!message) {
        return;
      }

      sendBtn.disabled = true;

      try {
        const response = await fetch(
          `/api/support/conversation/${conversationId}/messages`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              Accept: "application/json",
            },

            body: JSON.stringify({
              message,
            }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر إرسال الرسالة");
        }

        messageInput.value = "";

        await loadMessages();
      } catch (error) {
        console.error("SEND SUPPORT MESSAGE ERROR:", error);

        alert(error.message || "تعذر إرسال الرسالة");
      } finally {
        sendBtn.disabled = false;

        messageInput.focus();
      }
    });
  }

  // =========================================
  // اختيار التقييم
  // =========================================

  const updateRatingStars = (rating) => {
    selectedRating = rating;

    stars.forEach((star) => {
      const value = Number(star.dataset.rating);

      star.classList.toggle("selected", value <= rating);
    });

    const labels = {
      1: "غير راضٍ",
      2: "بحاجة لتحسين",
      3: "جيد",
      4: "ممتاز",
      5: "ممتاز جدًا ❤️",
    };

    if (selectedRatingText) {
      selectedRatingText.textContent = labels[rating] || "اختر تقييمك";
    }

    if (submitRatingBtn) {
      submitRatingBtn.disabled = false;
    }
  };

  stars.forEach((star) => {
    star.addEventListener("click", () => {
      if (star.disabled) {
        return;
      }

      updateRatingStars(Number(star.dataset.rating));
    });
  });

  // =========================================
  // إرسال التقييم
  // =========================================

  if (submitRatingBtn) {
    submitRatingBtn.addEventListener("click", async () => {
      if (!conversationId || !selectedRating) {
        return;
      }

      submitRatingBtn.disabled = true;

      try {
        const response = await fetch(
          `/api/support/conversation/${conversationId}/rating`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",

              Accept: "application/json",
            },

            body: JSON.stringify({
              rating: selectedRating,

              comment: ratingComment.value.trim(),
            }),
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر إرسال التقييم");
        }

        selectedRatingText.textContent = "شكرًا لتقييمك ❤️";

        ratingComment.disabled = true;

        stars.forEach((star) => {
          star.disabled = true;

          star.style.cursor = "default";
        });

        submitRatingBtn.textContent = "تم إرسال التقييم ✓";
      } catch (error) {
        console.error("RATE SUPPORT ERROR:", error);

        alert(error.message || "تعذر إرسال التقييم");

        submitRatingBtn.disabled = false;
      }
    });
  }

  // =========================================
  // بدء محادثة جديدة بعد الإغلاق
  // =========================================

  const startNewConversation = async () => {
    if (!newConversationBtn) {
      return;
    }

    newConversationBtn.disabled = true;

    newConversationBtn.textContent = "جاري بدء محادثة جديدة...";

    try {
      const response = await fetch("/api/support/conversation", {
        method: "POST",

        headers: {
          "Content-Type": "application/json",

          Accept: "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر بدء المحادثة الجديدة");
      }

      conversationId = data.conversation.id;

      lastMessagesHash = "";

      // إعادة ضبط التقييم
      selectedRating = 0;

      stars.forEach((star) => {
        star.disabled = false;

        star.classList.remove("selected");

        star.style.cursor = "pointer";
      });

      if (ratingComment) {
        ratingComment.value = "";
        ratingComment.disabled = false;
      }

      if (selectedRatingText) {
        selectedRatingText.textContent = "اختر تقييمك";
      }

      if (submitRatingBtn) {
        submitRatingBtn.disabled = true;

        submitRatingBtn.textContent = "إرسال التقييم ⭐";
      }

      showWaiting();

      updateStatus(data.conversation.status);

      await loadMessages();

      startPolling();
    } catch (error) {
      console.error("START NEW SUPPORT ERROR:", error);

      alert(error.message || "تعذر بدء المحادثة الجديدة");

      newConversationBtn.disabled = false;

      newConversationBtn.textContent = "💬 بدء محادثة جديدة";
    }
  };

  // =========================================
  // CANCEL CONVERSATION — إلغاء المحادثة
  // =========================================
  const cancelCurrentConversation = async () => {
    if (!currentConversationId) {
      return;
    }

    const confirmed = window.confirm("هل أنت متأكد من إلغاء المحادثة؟");

    if (!confirmed) {
      return;
    }

    if (cancelConversationBtn) {
      cancelConversationBtn.disabled = true;
      cancelConversationBtn.textContent = "جاري الإلغاء...";
    }

    try {
      const response = await fetch(
        `/api/support/conversation/${currentConversationId}/cancel`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر إلغاء المحادثة");
      }

      currentConversationId = null;

      showWelcome();
    } catch (error) {
      console.error("CANCEL CONVERSATION ERROR:", error);

      alert(error.message || "حدث خطأ أثناء إلغاء المحادثة");

      if (cancelConversationBtn) {
        cancelConversationBtn.disabled = false;
        cancelConversationBtn.textContent = "✖ إلغاء المحادثة";
      }
    }
  };

  // =========================================
  // زر محادثة جديدة
  // =========================================

  if (newConversationBtn) {
    newConversationBtn.addEventListener("click", startNewConversation);
  }

  // =========================================
  // CANCEL BUTTON — إلغاء المحادثة
  // =========================================
  document.addEventListener("click", async (event) => {
    const button = event.target.closest("#cancelConversationBtn");

    if (!button) {
      return;
    }

    event.preventDefault();

    const confirmed = window.confirm("هل أنت متأكد من إلغاء المحادثة؟");

    if (!confirmed) {
      return;
    }

    button.disabled = true;
    button.textContent = "جاري الإلغاء...";

    try {
      // جلب المحادثة الحالية
      const conversationResponse = await fetch("/api/support/conversation", {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const conversationData = await conversationResponse.json();

      if (
        !conversationResponse.ok ||
        !conversationData.success ||
        !conversationData.conversation
      ) {
        throw new Error(
          conversationData.message || "لا توجد محادثة قابلة للإلغاء",
        );
      }

      const conversationId = conversationData.conversation.id;

      // إرسال طلب الإلغاء
      const response = await fetch(
        `/api/support/conversation/${conversationId}/cancel`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر إلغاء المحادثة");
      }

      // إعادة تحميل حالة الصفحة
      window.location.reload();
    } catch (error) {
      console.error("CANCEL CONVERSATION ERROR:", error);

      alert(error.message || "حدث خطأ أثناء إلغاء المحادثة");

      button.disabled = false;
      button.textContent = "✖ إلغاء المحادثة";
    }
  });

  // =========================================
  // Polling
  // =========================================

  const startPolling = () => {
    stopPolling();

    pollingTimer = setInterval(async () => {
      await loadMessages();
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);

      pollingTimer = null;
    }
  };

  // =========================================
  // Enter لإرسال الرسالة
  // Shift + Enter سطر جديد
  // =========================================

  if (messageInput) {
    messageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        messageForm.requestSubmit();
      }
    });
  }

  // =========================================
  // تنظيف عند مغادرة الصفحة
  // =========================================

  window.addEventListener("beforeunload", stopPolling);

  // =========================================
  // البداية
  // =========================================

  initialize();
});
