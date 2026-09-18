const chatContainer = document.getElementById("orderChat");
const chatForm = document.getElementById("chatForm");
const chatMessage = document.getElementById("chatMessage");

const orderId = chatContainer?.dataset.orderId;

let lastMessageId = 0;

// =====================================================
// حماية النص من HTML
// =====================================================

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// =====================================================
// عرض رسائل المحادثة وحالة الدردشة
// =====================================================

function renderMessages(messages, chatOpen) {
  if (!messages || messages.length === 0) {
    chatContainer.innerHTML = `
      <div class="chat-empty">
        لا توجد رسائل حتى الآن
      </div>
    `;

    lastMessageId = 0;
  } else {
    chatContainer.innerHTML = messages
      .map((message) => {
        const isCallCenter =
          message.sender_role === "call_center";

        return `
          <div class="chat-message ${
            isCallCenter
              ? "chat-message-agent"
              : "chat-message-customer"
          }">

            <div class="chat-message-header">
              <strong>
                ${escapeHtml(
                  message.sender_name || "مستخدم",
                )}
              </strong>

              <span>
                ${new Date(
                  message.created_at,
                ).toLocaleString("ar-JO")}
              </span>
            </div>

            <div class="chat-message-body">
              ${escapeHtml(message.message)}
            </div>

          </div>
        `;
      })
      .join("");

    lastMessageId =
      messages[messages.length - 1].id;

    chatContainer.scrollTop =
      chatContainer.scrollHeight;
  }

  // =====================================================
  // تحديث حالة المحادثة
  // =====================================================

  const sendButton =
    chatForm?.querySelector("button");

  let closedMessage =
    chatForm?.parentElement.querySelector(
      ".chat-closed-message",
    );

  if (!chatOpen) {
    chatMessage.disabled = true;

    if (sendButton) {
      sendButton.disabled = true;
    }

    chatMessage.placeholder =
      "🔒 انتهت مدة المحادثة لهذا الطلب";

    if (!closedMessage && chatForm) {
      closedMessage =
        document.createElement("div");

      closedMessage.className =
        "chat-closed-message";

      closedMessage.textContent =
        "🔒 انتهت مدة المحادثة لهذا الطلب";

      chatForm.before(closedMessage);
    }
  } else {
    chatMessage.disabled = false;

    if (sendButton) {
      sendButton.disabled = false;
    }

    chatMessage.placeholder =
      "اكتب رسالتك للزبون...";

    if (closedMessage) {
      closedMessage.remove();
    }
  }
}

// =====================================================
// جلب رسائل الطلب
// =====================================================

async function loadMessages() {
  if (!orderId) {
    return;
  }

  try {
    const response = await fetch(
      `/api/orders/${orderId}/messages`,
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message ||
          "حدث خطأ أثناء جلب الرسائل",
      );
    }

    renderMessages(
      data.messages,
      data.chatOpen,
    );
  } catch (error) {
    console.error(
      "LOAD CHAT ERROR:",
      error,
    );

    chatContainer.innerHTML = `
      <div class="chat-error">
        حدث خطأ أثناء تحميل المحادثة
      </div>
    `;
  }
}

// =====================================================
// إرسال رسالة
// =====================================================

chatForm?.addEventListener(
  "submit",
  async (event) => {
    event.preventDefault();

    const message =
      chatMessage.value.trim();

    if (!message || !orderId) {
      return;
    }

    const sendButton =
      chatForm.querySelector("button");

    sendButton.disabled = true;

    try {
      const response = await fetch(
        `/api/orders/${orderId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            message,
          }),
        },
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "حدث خطأ أثناء إرسال الرسالة",
        );
      }

      chatMessage.value = "";

      await loadMessages();
    } catch (error) {
      console.error(
        "SEND CHAT MESSAGE ERROR:",
        error,
      );

      alert(
        error.message ||
          "حدث خطأ أثناء إرسال الرسالة",
      );
    } finally {
      // لا نعيد تفعيل الزر هنا بشكل أعمى
      // loadMessages() هي التي تحدد حالته
      await loadMessages();

      if (!chatMessage.disabled) {
        sendButton.disabled = false;
        chatMessage.focus();
      }
    }
  },
);

// =====================================================
// التشغيل الأول
// =====================================================

loadMessages();

// =====================================================
// تحديث المحادثة تلقائيًا
// =====================================================

setInterval(
  loadMessages,
  3000,
);