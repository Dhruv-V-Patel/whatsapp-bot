const chatList = document.querySelector("#chatList");
const messageList = document.querySelector("#messageList");
const chatHeader = document.querySelector("#chatHeader");
const searchInput = document.querySelector("#searchInput");
const searchBox = document.querySelector(".search-box");
const clearSearchButton = document.querySelector("#clearSearchButton");
const refreshButton = document.querySelector("#refreshButton");

let conversations = [];
let selectedPhone = null;

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitials(name, phone) {
  const source = (name || phone || "WA").trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase();
}

function formatTime(value) {
  if (!value) return "";

  const date = new Date(value);
  const now = new Date();

  const startOfToday = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );

  const startOfMessageDay = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
  );

  const diffDays = Math.floor(
    (startOfToday - startOfMessageDay) / (1000 * 60 * 60 * 24),
  );

  // Today
  if (diffDays === 0) {
    return date
      .toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      })
      .toLowerCase();
  }

  // Yesterday
  if (diffDays === 1) {
    return "Yesterday";
  }

  // Last 7 days
  if (diffDays < 7) {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
    });
  }

  // Older
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function groupMessages(messages) {
  const map = new Map();

  messages.forEach((message) => {
    if (!map.has(message.phone)) {
      map.set(message.phone, {
        phone: message.phone,
        name: message.name || "Customer",
        unread_count: message.unread_count || 0,
        messages: [],
      });
    }

    //map.get(message.phone).messages.push(message);

    const conversation = map.get(message.phone);

    conversation.unread_count = Math.max(
      conversation.unread_count || 0,
      message.unread_count || 0,
    );

    conversation.messages.push(message);
  });

  return Array.from(map.values()).map((conversation) => {
    conversation.messages.sort(
      (a, b) => new Date(a.created_at) - new Date(b.created_at),
    );
    conversation.lastMessage =
      conversation.messages[conversation.messages.length - 1];
    return conversation;
  });
}

function getFilteredConversations() {
  const query = searchInput.value.trim().toLowerCase();

  if (!query) return conversations;

  return conversations.filter((conversation) => {
    const haystack = [
      conversation.name,
      conversation.phone,
      ...conversation.messages.map((message) => message.message || ""),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(query);
  });
}

const getMediaType = (mimeType) => {
  if (!mimeType) return "text";

  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";

  if (
    mimeType.includes("pdf") ||
    mimeType.includes("document") ||
    mimeType.includes("officedocument")
  ) {
    return "document";
  }

  return "file";
};

const getMediaIcon = (type) => {
  switch (type) {
    case "image":
      return "fa-image";

    case "video":
      return "fa-video";

    case "audio":
      return "fa-music";

    case "document":
      return "fa-file-lines";

    default:
      return "fa-file";
  }
};

const getMediaLabel = (type) => {
  switch (type) {
    case "image":
      return "Image";

    case "video":
      return "Video";

    case "audio":
      return "Audio";

    case "document":
      return "Document";

    default:
      return "File";
  }
};

const renderMessageContent = (message) => {
  const type = getMediaType(message.mime_type);

  if (type === "text") {
    return `
      <div class="message-text">
        ${escapeHtml(message.message || "")}
      </div>
    `;
  }

  return `
    <div class="message-placeholder">
      <div class="message-placeholder-icon">
        <i class="fa-solid ${getMediaIcon(type)}"></i>
      </div>

      <div class="message-placeholder-content">
        <div class="message-placeholder-title">
          ${getMediaLabel(type)}
        </div>

        <div class="message-placeholder-subtitle">
          Preview Not Available
        </div>
      </div>
    </div>
  `;
};

function renderChatList(options = {}) {
  const filtered = getFilteredConversations();

  if (!filtered.length) {
    chatList.innerHTML = `
      <div class="empty-state">
        <h2>No messages</h2>
        <p>Incoming WhatsApp messages will show here after the webhook receives them.</p>
      </div>
    `;
    return;
  }

  chatList.innerHTML = filtered
    .map((conversation) => {
      const isActive = conversation.phone === selectedPhone ? " active" : "";
      // const preview = conversation.lastMessage?.message || "";
      const last = conversation.lastMessage;

      let preview = last?.message || "";

      const mediaType = getMediaType(last?.mime_type);

      if (mediaType !== "text") {
        preview = `${getMediaLabel(mediaType)} Preview Not Available`;
      }

      //console.log(conversation.phone, conversation.unread_count);
      return `
        <button class="chat-item${isActive}" type="button" data-phone="${escapeHtml(conversation.phone)}">
          <div class="avatar">${escapeHtml(getInitials(conversation.name, conversation.phone))}</div>
          <div>
            <div class="chat-name-row">
              <div class="chat-name">${escapeHtml(conversation.name)}</div>
              <time class="chat-time">${escapeHtml(formatTime(conversation.lastMessage?.created_at))}</time>
            </div>
            <div class="chat-preview-row">

  <div class="chat-preview">
    ${escapeHtml(preview)}
  </div>

  ${
    conversation.unread_count > 0
      ? `
      <span class="unread-badge">
        ${conversation.unread_count}
      </span>
      `
      : ""
  }

</div>
          </div>
        </button>
      `;
    })
    .join("");

  if (options.resetScroll) {
    chatList.scrollTop = 0;
  }
}

function renderMessages() {
  const conversation = conversations.find(
    (item) => item.phone === selectedPhone,
  );

  if (!conversation) {
    chatHeader.innerHTML = `
      <div class="avatar">WA</div>
      <div>
        <h2>Select a chat</h2>
        <p>Choose a contact to start viewing messages</p>
      </div>
    `;
    messageList.innerHTML = `
      <div class="empty-state">
      <i class="fa-brands fa-whatsapp no-select-contact"></i>
        <h2>WhatsApp Messages</h2>
        <p>Select a contact from the left sidebar.</p>
      </div>
    `;
    return;
  }

  chatHeader.innerHTML = `
    <div class="avatar">${escapeHtml(getInitials(conversation.name, conversation.phone))}</div>
    <div>
      <h2>${escapeHtml(conversation.name)}</h2>
      <p>${escapeHtml(conversation.phone)}</p>
    </div>
      <div class="chat-menu-wrapper">
    <button class="chat-menu-btn" id="chatMenuBtn">
      <i class="fa-solid fa-ellipsis-vertical"></i>
    </button>

    <div class="chat-dropdown" id="chatDropdown">
      <button id="clearChatBtn">
        <i class="fa-solid fa-broom"></i>
        Clear Chat
      </button>

      <button id="deleteContactBtn">
        <i class="fa-solid fa-trash"></i>
        Delete Contact
      </button>
    </div>
  </div>
  `;

  const menuBtn = document.getElementById("chatMenuBtn");
  const dropdown = document.getElementById("chatDropdown");

  menuBtn?.addEventListener("click", (e) => {
    e.stopPropagation();
    dropdown.classList.toggle("show");
  });

  document.addEventListener("click", () => {
    dropdown?.classList.remove("show");
  });
  // <div class="message-text">${escapeHtml(message.message || "")}</div>
  const clearBtn = document.getElementById("clearChatBtn");

  clearBtn?.addEventListener("click", async () => {
    if (!confirm("Clear chat?")) return;

    console.log("Clear Btn Clicked", selectedPhone);

    const response = await fetch(
      `/api/messages/clear/${selectedPhone}`,
      {
        method: "DELETE",
      }
    );

    const result = await response.json();

    console.log(result);

    await loadMessages();
  });

  const deleteBtn = document.getElementById("deleteContactBtn");

  deleteBtn?.addEventListener("click", async () => {
    if (!confirm("Delete contact?")) return;

    console.log("Delete Btn Clicked", selectedPhone);

    await fetch(
      `/api/messages/contact/${selectedPhone}`,
      {
        method: "DELETE",
      }
    );

    selectedPhone = null;

    await loadMessages();
  });

  messageList.innerHTML = conversation.messages
    .map(
      (message) => `
      <div class="message-row ${escapeHtml(message.direction || "incoming")}">
        <article class="message-bubble">
          ${renderMessageContent(message)}
          <time class="message-time">${escapeHtml(formatTime(message.created_at))}</time>
        </article>
      </div>
    `,
    )
    .join("");

  messageList.scrollTop = messageList.scrollHeight;
}

async function loadMessages() {
  try {
    const response = await fetch("/api/messages");

    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    conversations = groupMessages(data.messages || []);

    // if (!selectedPhone && conversations.length) {
    //   selectedPhone = conversations[0].phone;
    // }

    renderChatList();
    renderMessages();
  } catch (error) {
    chatList.innerHTML = `
      <div class="error-state">
        <h2>Unable to load</h2>
        <p>Check the server and database connection, then refresh.</p>
      </div>
    `;
    console.error(error);
  }
}

chatList.addEventListener("click", async (event) => {
  const item = event.target.closest(".chat-item");

  if (!item) return;

  selectedPhone = item.dataset.phone;
  await fetch(`/api/messages/mark-read/${selectedPhone}`, {
    method: "POST",
  });

  const conversation = conversations.find((c) => c.phone === selectedPhone);

  if (conversation) {
    conversation.unread_count = 0;
  }
  renderChatList();
  renderMessages();
});

searchInput.addEventListener("input", () => {
  searchBox.classList.toggle("has-value", Boolean(searchInput.value));
  renderChatList({ resetScroll: true });
});

clearSearchButton.addEventListener("click", () => {
  searchInput.value = "";
  searchBox.classList.remove("has-value");
  renderChatList({ resetScroll: true });
  searchInput.focus();
});

refreshButton.addEventListener("click", loadMessages);

loadMessages();
// setInterval(loadMessages, 2000);

document.getElementById("logPageBtn")?.addEventListener("click", () => {
  window.location.href = "/messagelogs";
});

document.getElementById("chatPageBtn")?.addEventListener("click", () => {
  window.location.href = "/";
});

const openChat = () => {
  if (window.innerWidth <= 768) {
    document.querySelector(".chat-panel").classList.add("mobile-open");
  }
};
document.getElementById("mobileBackBtn")?.addEventListener("click", () => {
  document.querySelector(".chat-panel").classList.remove("mobile-open");
});

//======================== Update the Incomeing Message Without need refresh ===============================
const socket = io();

socket.on("connect", () => {
  console.log("Socket Connected");
});

socket.on("new-message", (msg) => {
  console.log("New Message", msg);

  // reload chat automatically
  loadMessages();
});
