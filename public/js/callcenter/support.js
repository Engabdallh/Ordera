document.addEventListener("DOMContentLoaded", () => {
  // =========================================
  // ELEMENTS
  // =========================================

  const conversationsList = document.getElementById("conversationsList");

  const refreshBtn = document.getElementById("refreshConversationsBtn");

  const waitingCount = document.getElementById("waitingCount");

  const activeCount = document.getElementById("activeCount");

  const closedCount = document.getElementById("closedCount");

  const chatEmpty = document.getElementById("chatEmpty");

  const chatContent = document.getElementById("chatContent");

  const customerName = document.getElementById("customerName");

  const customerEmail = document.getElementById("customerEmail");

  const customerPhone = document.getElementById("customerPhone");

  const chatStatus = document.getElementById("chatStatus");

  const chatStatusText = document.getElementById("chatStatusText");

  const assignBtn = document.getElementById("assignBtn");

  const closeConversationBtn = document.getElementById("closeConversationBtn");

  const supportMessages = document.getElementById("supportMessages");

  const agentMessageForm = document.getElementById("agentMessageForm");

  const agentMessageInput = document.getElementById("agentMessageInput");

  const agentSendBtn = document.getElementById("agentSendBtn");

  const agentTyping = document.getElementById("agentTyping");

  let selectedConversationId = null;

  let selectedConversation = null;

  let pollingTimer = null;

  let messagePollingTimer = null;

  let lastConversationIds = new Set();

  let knownWaitingIds = new Set();

  let lastMessagesHash = "";

  let audioContext = null;

  // =========================================
  // HELPERS
  // =========================================

  const formatTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("ar-JO", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDate = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleString("ar-JO", {
      dateStyle: "short",
      timeStyle: "short",
    });
  };

  const escapeText = (value) => {
    return String(value ?? "");
  };

  // =========================================
  // NOTIFICATION SOUND
  // =========================================

  const playNotificationSound = () => {
    try {
      if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();

      const gain = audioContext.createGain();

      oscillator.type = "sine";

      oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

      oscillator.frequency.setValueAtTime(
        1174,
        audioContext.currentTime + 0.12,
      );

      gain.gain.setValueAtTime(0.0001, audioContext.currentTime);

      gain.gain.exponentialRampToValueAtTime(
        0.18,
        audioContext.currentTime + 0.02,
      );

      gain.gain.exponentialRampToValueAtTime(
        0.0001,
        audioContext.currentTime + 0.35,
      );

      oscillator.connect(gain);

      gain.connect(audioContext.destination);

      oscillator.start();

      oscillator.stop(audioContext.currentTime + 0.4);
    } catch (error) {
      console.warn("Notification sound unavailable:", error);
    }
  };

  // =========================================
  // BROWSER NOTIFICATION
  // =========================================

  const requestNotificationPermission = async () => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission === "default") {
      try {
        await Notification.requestPermission();
      } catch (error) {
        console.warn("Notification permission error:", error);
      }
    }
  };

  const showBrowserNotification = (conversation) => {
    if (!("Notification" in window)) {
      return;
    }

    if (Notification.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification("💬 محادثة دعم جديدة", {
        body: `${conversation.customer_name || "عميل"} يريد التواصل مع الكول سنتر`,
        icon: "/favicon.ico",
      });

      notification.onclick = () => {
        window.focus();

        selectConversation(conversation.id);

        notification.close();
      };
    } catch (error) {
      console.warn("Browser notification error:", error);
    }
  };

  // =========================================
  // TOAST
  // =========================================

  const showToast = (title, message) => {
    let toast = document.getElementById("supportToast");

    if (!toast) {
      toast = document.createElement("div");

      toast.id = "supportToast";

      toast.style.position = "fixed";

      toast.style.top = "22px";

      toast.style.left = "22px";

      toast.style.zIndex = "999999";

      toast.style.width = "320px";

      toast.style.padding = "15px 17px";

      toast.style.background = "linear-gradient(145deg,#181818,#0b0b0b)";

      toast.style.border = "1px solid #ff6500";

      toast.style.borderRadius = "12px";

      toast.style.boxShadow = "0 0 30px rgba(255,101,0,.25)";

      toast.style.color = "#fff";

      toast.style.cursor = "pointer";

      document.body.appendChild(toast);
    }

    toast.innerHTML = `
      <div style="
        color:#ff7200;
        font-weight:800;
        font-size:14px;
        margin-bottom:5px;
      ">
        ${escapeText(title)}
      </div>

      <div style="
        color:#aaa;
        font-size:12px;
        line-height:1.7;
      ">
        ${escapeText(message)}
      </div>
    `;

    toast.onclick = () => {
      if (selectedConversationId) {
        selectConversation(selectedConversationId);
      }

      toast.remove();
    };

    clearTimeout(toast._timer);

    toast._timer = setTimeout(() => {
      if (toast) {
        toast.remove();
      }
    }, 6000);
  };

  // =========================================
  // UPDATE STATS
  // =========================================

  const updateStats = (stats = {}) => {
    waitingCount.textContent = Number(stats.waitingCount || 0);

    activeCount.textContent = Number(stats.activeCount || 0);

    closedCount.textContent = Number(stats.closedCount || 0);
  };

  // =========================================
  // STATUS
  // =========================================

  const updateChatStatus = (status) => {
    chatStatus.classList.remove("waiting", "active", "closed");

    if (status === "بانتظار الكول سنتر") {
      chatStatus.classList.add("waiting");

      chatStatusText.textContent = "بانتظار استلام المحادثة";
    } else if (status === "بانتظار العميل") {
      chatStatus.classList.add("active");

      chatStatusText.textContent = "بانتظار رد العميل";
    } else if (status === "مغلقة") {
      chatStatus.classList.add("closed");

      chatStatusText.textContent = "المحادثة مغلقة";
    } else {
      chatStatusText.textContent = status || "غير معروف";
    }
  };

  // =========================================
  // RENDER CONVERSATION LIST
  // =========================================

  const renderConversations = (conversations) => {
    const list = Array.isArray(conversations) ? conversations : [];

    conversationsList.innerHTML = "";

    if (list.length === 0) {
      conversationsList.innerHTML = `
        <div style="
          min-height:250px;
          display:flex;
          align-items:center;
          justify-content:center;
          flex-direction:column;
          gap:10px;
          color:#666;
          text-align:center;
          padding:25px;
        ">
          <div style="font-size:40px;">
            💬
          </div>

          <div style="font-size:13px;">
            لا توجد محادثات حاليًا
          </div>
        </div>
      `;

      return;
    }

    list.forEach((conversation) => {
      const item = document.createElement("button");

      item.type = "button";

      item.className = "conversation-item";

      if (Number(conversation.id) === Number(selectedConversationId)) {
        item.classList.add("selected");
      }

      const statusClass =
        conversation.status === "بانتظار الكول سنتر"
          ? "waiting"
          : conversation.status === "بانتظار العميل"
            ? "active"
            : "closed";

      const preview = conversation.last_message || "لا توجد رسائل بعد";

      item.innerHTML = `
          <div class="conversation-top">

            <span class="conversation-name">
              ${escapeText(conversation.customer_name || "عميل")}
            </span>

            <span class="conversation-time">
              ${
                formatTime(
                  conversation.last_message_at || conversation.updated_at,
                ) || "-"
              }
            </span>

          </div>

          <div class="conversation-preview">
            ${escapeText(preview)}
          </div>

          <span class="conversation-status-badge ${statusClass}">
            ${
              conversation.status === "بانتظار الكول سنتر"
                ? "🟡 "
                : conversation.status === "بانتظار العميل"
                  ? "🟢 "
                  : "🔴 "
            }

            ${escapeText(conversation.status)}
          </span>
        `;

      item.addEventListener("click", () => {
        selectConversation(conversation.id);
      });

      conversationsList.appendChild(item);
    });
  };

  // =========================================
  // NEW CONVERSATION DETECTION
  // =========================================

  const detectNewWaitingConversations = (conversations) => {
    const waiting = conversations.filter(
      (conversation) => conversation.status === "بانتظار الكول سنتر",
    );

    const currentIds = new Set(
      waiting.map((conversation) => Number(conversation.id)),
    );

    // أول تحميل:
    // نعتمد الموجود حاليًا كمعروف
    // حتى لا يصدر صوت لكل المحادثات القديمة.
    if (knownWaitingIds.size === 0 && lastConversationIds.size === 0) {
      knownWaitingIds = currentIds;

      return;
    }

    const newConversations = waiting.filter(
      (conversation) => !knownWaitingIds.has(Number(conversation.id)),
    );

    newConversations.forEach((conversation) => {
      playNotificationSound();

      showBrowserNotification(conversation);

      showToast(
        "🔔 محادثة دعم جديدة",
        `${conversation.customer_name || "عميل"} ينتظر رد الكول سنتر`,
      );
    });

    knownWaitingIds = currentIds;
  };

  // =========================================
  // LOAD SUPPORT DATA
  // =========================================

  const loadSupportData = async (silent = false) => {
    try {
      const response = await fetch("/api/call-center/support", {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل محادثات الدعم");
      }

      updateStats(data.stats);

      detectNewWaitingConversations(data.conversations);

      renderConversations(data.conversations);

      // إذا كانت المحادثة الحالية تغيرت
      if (selectedConversationId) {
        const current = data.conversations.find(
          (conversation) =>
            Number(conversation.id) === Number(selectedConversationId),
        );

        if (current) {
          selectedConversation = current;

          updateChatStatus(current.status);

          updateAssignButton(current);
        }
      }
    } catch (error) {
      console.error("LOAD SUPPORT DATA ERROR:", error);

      if (!silent) {
        showToast("خطأ", error.message || "تعذر تحديث محادثات الدعم");
      }
    }
  };

  // =========================================
  // SELECT CONVERSATION
  // =========================================

  window.selectConversation = async (conversationId) => {
    selectedConversationId = Number(conversationId);

    lastMessagesHash = "";

    chatEmpty.classList.add("hidden");

    chatContent.classList.remove("hidden");

    supportMessages.innerHTML = `
        <div style="
          flex:1;
          display:flex;
          align-items:center;
          justify-content:center;
          color:#666;
          font-size:12px;
        ">
          جاري تحميل المحادثة...
        </div>
      `;

    await loadConversationDetails(selectedConversationId);

    startMessagePolling();
  };

  // =========================================
  // LOAD CONVERSATION DETAILS
  // =========================================

  const loadConversationDetails = async (conversationId) => {
    try {
      const response = await fetch(`/call-center/support/${conversationId}`, {
        method: "GET",

        headers: {
          Accept: "application/json",
        },

        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "تعذر تحميل المحادثة");
      }

      selectedConversation = data.conversation;

      customerName.textContent = data.conversation.customer_name || "عميل";

      customerEmail.textContent = `📧 ${
        data.conversation.customer_email || "-"
      }`;

      customerPhone.textContent = `📱 ${
        data.conversation.customer_phone || "-"
      }`;

      updateChatStatus(data.conversation.status);

      updateAssignButton(data.conversation);

      renderMessages(data.messages);
    } catch (error) {
      console.error("LOAD SUPPORT CONVERSATION ERROR:", error);

      showToast("خطأ", error.message || "تعذر تحميل المحادثة");
    }
  };

  // =========================================
  // ASSIGN BUTTON
  // =========================================

  const updateAssignButton = (conversation) => {
    if (!conversation) {
      return;
    }

    const assignedAgentId = conversation.assigned_agent_id;

    if (conversation.status === "مغلقة") {
      assignBtn.disabled = true;

      assignBtn.textContent = "المحادثة مغلقة";

      closeConversationBtn.disabled = true;

      agentMessageInput.disabled = true;

      agentSendBtn.disabled = true;

      return;
    }

    if (assignedAgentId) {
      assignBtn.disabled = true;

      assignBtn.textContent = "✓ مستلمة منك / موظف آخر";

      // إذا كانت مستلمة من شخص آخر
      // نوقف الإرسال.
      // المتصفح لا يعرف اسم الموظف،
      // لذلك المقارنة تكون بالـsession
      // عند السيرفر.
    } else {
      assignBtn.disabled = false;

      assignBtn.textContent = "استلام المحادثة";
    }
  };

  if (assignBtn) {
    assignBtn.addEventListener("click", async () => {
      if (!selectedConversationId) {
        return;
      }

      assignBtn.disabled = true;

      assignBtn.textContent = "جاري الاستلام...";

      try {
        const response = await fetch(
          `/api/call-center/support/${selectedConversationId}/assign`,
          {
            method: "POST",

            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر استلام المحادثة");
        }

        showToast("تم الاستلام ✅", "أصبحت المحادثة تحت مسؤوليتك");

        await loadConversationDetails(selectedConversationId);

        await loadSupportData(true);
      } catch (error) {
        console.error("ASSIGN SUPPORT ERROR:", error);

        showToast("تعذر الاستلام", error.message || "حدث خطأ");

        assignBtn.disabled = false;

        assignBtn.textContent = "استلام المحادثة";
      }
    });
  }

  // =========================================
  // RENDER MESSAGES
  // =========================================

  // =========================================
  // RENDER MESSAGES — عرض الرسائل مع اسم المرسل
  // =========================================
  const renderMessages = (messages) => {
    const list = Array.isArray(messages) ? messages : [];

    const hash = list
      .map((message) =>
        [
          message.id,
          message.sender_role,
          message.sender_name,
          message.message,
          message.created_at,
        ].join("|"),
      )
      .join("||");

    if (hash === lastMessagesHash && supportMessages.children.length > 0) {
      return;
    }

    lastMessagesHash = hash;

    supportMessages.innerHTML = "";

    if (list.length === 0) {
      supportMessages.innerHTML = `
      <div style="
        flex:1;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#666;
        font-size:12px;
      ">
        لا توجد رسائل في هذه المحادثة.
      </div>
    `;

      return;
    }

    list.forEach((message) => {
      const wrapper = document.createElement("div");

      wrapper.className = `support-message ${message.sender_role}`;

      // اسم المرسل
      const senderName = document.createElement("div");

      senderName.className = "support-message-sender";

      senderName.textContent =
        message.sender_role === "call_center"
          ? message.sender_name || "الكول سنتر"
          : message.sender_name || "الزبون";

      // نص الرسالة
      const text = document.createElement("div");

      text.textContent = String(message.message ?? "");

      // وقت الرسالة
      const meta = document.createElement("div");

      meta.className = "support-message-meta";

      meta.textContent = formatTime(message.created_at);

      // ترتيب العناصر داخل الرسالة
      wrapper.appendChild(senderName);

      wrapper.appendChild(text);

      wrapper.appendChild(meta);

      supportMessages.appendChild(wrapper);
    });

    supportMessages.scrollTop = supportMessages.scrollHeight;
  };
  // =========================================
  // MESSAGE POLLING
  // =========================================

  const startMessagePolling = () => {
    stopMessagePolling();

    messagePollingTimer = setInterval(async () => {
      if (selectedConversationId) {
        await loadConversationDetails(selectedConversationId);
      }
    }, 2000);
  };

  const stopMessagePolling = () => {
    if (messagePollingTimer) {
      clearInterval(messagePollingTimer);

      messagePollingTimer = null;
    }
  };

  // =========================================
  // SEND AGENT MESSAGE
  // =========================================

  if (agentMessageForm) {
    agentMessageForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      if (!selectedConversationId) {
        return;
      }

      const message = agentMessageInput.value.trim();

      if (!message) {
        return;
      }

      agentSendBtn.disabled = true;

      try {
        const response = await fetch(
          `/api/call-center/support/${selectedConversationId}/messages`,
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

        agentMessageInput.value = "";

        lastMessagesHash = "";

        await loadConversationDetails(selectedConversationId);

        await loadSupportData(true);
      } catch (error) {
        console.error("SEND AGENT MESSAGE ERROR:", error);

        showToast("تعذر إرسال الرسالة", error.message || "حدث خطأ");
      } finally {
        agentSendBtn.disabled = false;

        agentMessageInput.focus();
      }
    });
  }

  // =========================================
  // CLOSE CONVERSATION
  // =========================================

  if (closeConversationBtn) {
    closeConversationBtn.addEventListener("click", async () => {
      if (!selectedConversationId) {
        return;
      }

      const confirmed = window.confirm("هل أنت متأكد من إنهاء هذه المحادثة؟");

      if (!confirmed) {
        return;
      }

      closeConversationBtn.disabled = true;

      try {
        const response = await fetch(
          `/api/call-center/support/${selectedConversationId}/close`,
          {
            method: "POST",

            headers: {
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.message || "تعذر إغلاق المحادثة");
        }

        showToast("تم إنهاء المحادثة ✅", "تم إغلاق المحادثة بنجاح");

        agentMessageInput.disabled = true;

        agentSendBtn.disabled = true;

        assignBtn.disabled = true;

        closeConversationBtn.disabled = true;

        closeConversationBtn.textContent = "✓ تم الإنهاء";

        lastMessagesHash = "";

        await loadConversationDetails(selectedConversationId);

        await loadSupportData(true);

        stopMessagePolling();
      } catch (error) {
        console.error("CLOSE SUPPORT ERROR:", error);

        showToast("تعذر إنهاء المحادثة", error.message || "حدث خطأ");

        closeConversationBtn.disabled = false;
      }
    });
  }

  // =========================================
  // REFRESH
  // =========================================

  if (refreshBtn) {
    refreshBtn.addEventListener("click", async () => {
      refreshBtn.disabled = true;

      refreshBtn.textContent = "جاري التحديث...";

      await loadSupportData(false);

      refreshBtn.disabled = false;

      refreshBtn.textContent = "↻ تحديث";
    });
  }

  // =========================================
  // ENTER TO SEND
  // SHIFT + ENTER = NEW LINE
  // =========================================

  if (agentMessageInput) {
    agentMessageInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();

        agentMessageForm.requestSubmit();
      }
    });
  }

  // =========================================
  // START MAIN POLLING
  // =========================================

  const startMainPolling = () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    pollingTimer = setInterval(async () => {
      await loadSupportData(true);
    }, 2000);
  };

  // =========================================
  // CLEANUP
  // =========================================

  window.addEventListener("beforeunload", () => {
    if (pollingTimer) {
      clearInterval(pollingTimer);
    }

    stopMessagePolling();
  });

  // =========================================
  // INITIALIZE
  // =========================================

  const initialize = async () => {
    await requestNotificationPermission();

    await loadSupportData(false);

    startMainPolling();
  };

  initialize();
});
