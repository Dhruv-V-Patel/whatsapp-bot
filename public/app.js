const chatList = document.querySelector("#chatList");
const messageList = document.querySelector("#messageList");
const chatHeader = document.querySelector("#chatHeader");
const searchInput = document.querySelector("#searchInput");
const searchBox = document.querySelector(".search-box");
const clearSearchButton = document.querySelector("#clearSearchButton");
const refreshButton = document.querySelector("#refreshButton");
const messageComposer = document.getElementById("messageComposer");
const filePreview = document.getElementById("filePreview");
const previewFileName = document.getElementById("previewFileName");
const previewFileSize = document.getElementById("previewFileSize");
const removeFileBtn = document.getElementById("closePreview");
const thumbIcon = document.getElementById("attachmentThumbIcon");
const attachmentSendBtn = document.getElementById("attachmentSendBtn");
const captionInput = document.getElementById("captionInput");
const attachmentFiles = document.getElementById("attachmentFiles");
const messageInput = document.getElementById("messageInput");
const messagesContainer = document.querySelector(".messages");

let conversations = [];
let selectedPhone = null;
let selectedFiles = [];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
const attachBtn = document.getElementById("attachBtn");
const fileInput = document.getElementById("fileInput");

attachBtn.onclick = () => {
  fileInput.click();
};

messageInput.addEventListener("keydown", (e) => {
  // Enter = Send
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    document.getElementById("sendBtn").click();
    return;
  }
});


const BASE_HEIGHT = 58;

messageInput.addEventListener("input", () => {
    // Resize textarea
    messageInput.style.height = "0px";

    const newHeight = Math.min(messageInput.scrollHeight, 140);
    messageInput.style.height = newHeight + "px";

     if (messageInput.scrollHeight > 140) {
        messageInput.style.overflowY = "auto";
      } else {
        messageInput.style.overflowY = "hidden";
      }
    // Resize composer with textarea
    messageComposer.style.height = Math.max(BASE_HEIGHT, newHeight + 24) + "px";

    // Keep icons centered for one line, bottom aligned for multiple lines
  if (newHeight <= 40) {
    messageComposer.style.alignItems = "center";
  } else {
    messageComposer.style.alignItems = "flex-end";
  }
});

const getAttachmentIcon = (mime) => {
  if (!mime) return "fa-file";

  if (mime.startsWith("image/")) return "fa-image";

  if (mime.startsWith("video/")) return "fa-video";

  if (mime.startsWith("audio/")) return "fa-music";

  if (mime.includes("pdf")) return "fa-file-pdf";

  if (mime.includes("word") || mime.includes("msword")) return "fa-file-word";

  if (mime.includes("excel") || mime.includes("spreadsheet"))
    return "fa-file-excel";

  if (mime.includes("csv") || fileName.toLowerCase().endsWith(".csv"))
    return "fa-file-csv";

  if (mime.includes("powerpoint") || mime.includes("presentation"))
    return "fa-file-powerpoint";

  if (mime.includes("zip") || mime.includes("rar")) return "fa-file-zipper";

  if (mime.startsWith("text/")) return "fa-file-lines";

  return "fa-file";
};

const closeFilePreview = () => {
  selectedFiles = [];
  fileInput.value = "";
  captionInput.value = "";
  attachmentFiles.innerHTML = "";

  previewFileName.textContent = "";
  previewFileSize.textContent = "";

  filePreview.classList.add("hidden");
  messageList.style.display = "block";
};

document.getElementById("sendBtn").onclick = async () => {
  const message = messageInput.value.trim();

  if (!message || !selectedPhone) return;

  try {
    const res = await fetch("/api/messages/send", {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        phone: selectedPhone,
        message,
      }),
    });

    if (!res.ok) throw new Error();

    messageInput.value = "";

    // Reset textarea
    messageInput.style.height = "24px";
    messageInput.style.overflowY = "hidden";
    // messageInput.scrollTop = 0;

// Reset composer
messageComposer.style.height = BASE_HEIGHT + "px";
messageComposer.style.alignItems = "center";

// Optional: keep cursor
    // loadMessages();
  } catch {
    alert("Failed to send message.");
  }
};

attachmentSendBtn.onclick = async () => {
  if (!selectedPhone || !selectedFiles.length === 0) return;

  try {
    attachmentSendBtn.disabled = true;

    const formData = new FormData();

    // formData.append("file", selectedFile);
    selectedFiles.forEach((file) => {
      formData.append("files", file);
    });

    document.getElementById("addMoreFileBtn").onclick = () => fileInput.click();
    formData.append("phone", selectedPhone);
    formData.append("caption", captionInput.value.trim());

    const res = await fetch("/api/messages/send-file", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) throw new Error();

    selectedFiles = [];
    fileInput.value = "";
    captionInput.value = "";

    filePreview.classList.add("hidden");
    messageList.style.display = "block";
    messageComposer.classList.add("show");

    await loadMessages();
  } catch (err) {
    alert("Failed to send file.");
  } finally {
    attachmentSendBtn.disabled = false;
  }
};

fileInput.onchange = () => {
  if (!fileInput.files.length) return;

  const newFiles = Array.from(fileInput.files);

  // Prevent duplicates
  newFiles.forEach((file) => {
    const exists = selectedFiles.some(
      (f) =>
        f.name === file.name &&
        f.size === file.size &&
        f.lastModified === file.lastModified,
    );

    if (!exists) {
      selectedFiles.push(file);
    }
  });

  renderSelectedFiles();

  messageList.style.display = "none";
  filePreview.classList.remove("hidden");
  messageComposer.classList.remove("show");

  fileInput.value = "";
};

removeFileBtn.onclick = () => {
  selectedFiles = [];
  attachmentFiles.innerHTML = "";
  fileInput.value = "";
  captionInput.value = "";

  renderSelectedFiles();
  filePreview.classList.add("hidden");
  messageList.style.display = "block";
  messageComposer.classList.add("show");
};

const renderSelectedFiles = () => {
  if (selectedFiles.length === 0) {
    attachmentFiles.innerHTML = "";
    previewFileName.textContent = "";
    previewFileSize.textContent = "";

    filePreview.classList.add("hidden");
    messageList.style.display = "block";
    messageComposer.classList.add("show");

    return;
  }

  attachmentFiles.innerHTML = "";

  selectedFiles.forEach((file, index) => {
    attachmentFiles.insertAdjacentHTML(
      "beforeend",
      `
            <div class="attachment-thumb">
                <i class="fa-solid ${getAttachmentIcon(file.type, file.name)}"></i>
                <div class="attachment-name" title="${file.name}">
                    ${file.name}
                </div>
                <button
                  class="remove-file"
                  data-index="${index}"
                  type="button"
                >
                  <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            `,
    );
  });
  // Always show Add More button
  attachmentFiles.insertAdjacentHTML(
    "beforeend",
    `
        <button
            id="addMoreFileBtn"
            class="attachment-add"
            type="button">
            <i class="fa-solid fa-plus"></i>
        </button>
        `,
  );

  document.getElementById("addMoreFileBtn").onclick = () => fileInput.click();
  if (selectedFiles.length === 1) {
    previewFileName.textContent = selectedFiles[0].name;
  } else {
    previewFileName.textContent = `${selectedFiles[0].name} +${selectedFiles.length - 1} more`;
  }

  const total = selectedFiles.reduce((s, f) => s + f.size, 0);

  previewFileSize.textContent = `${(total / 1024).toFixed(1)} KB`;
};

attachmentFiles.addEventListener("click", (e) => {
  const btn = e.target.closest(".remove-file");

  if (!btn) return;

  selectedFiles.splice(Number(btn.dataset.index), 1);

  // If no files left, restore normal chat view
  if (selectedFiles.length === 0) {
    attachmentFiles.innerHTML = "";
    fileInput.value = "";
    captionInput.value = "";
    previewFileName.textContent = "";
    previewFileSize.textContent = "";

    filePreview.classList.add("hidden");
    messageList.style.display = "block";
    messageComposer.classList.add("show");

    // Scroll back to latest message
    messageList.scrollTop = messageList.scrollHeight;

    return;
  }
  renderSelectedFiles();
});

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

// const formatMessage = (text = "") =>
//   escapeHtml(text)
//     .split(/\r?\n/)
//     .map(line => line.trimStart())
//     .join("<br>");

// const linkify = (text = "") => {
//   return escapeHtml(text).replace(
//     /\b((?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(?:\/[^\s<]*)?)/gi,
//     (match) => {
//       const href = /^https?:\/\//i.test(match)
//         ? match
//         : `https://${match}`;

//       return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="message-link">${match}</a>`;
//     }
//   );
// };

const linkify = (text = "") => {
  return escapeHtml(text).replace(
    /\b((?:https?:\/\/|www\.)[^\s<]+|(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(?:\/[^\s<]*)?)/gi,
    (url) => {
      const href = /^https?:\/\//i.test(url)
        ? url
        : `https://${url}`;

      return `<a href="${href}" target="_blank" rel="noopener noreferrer" class="message-link">${url}</a>`;
    }
  );
};

const formatMessage = (text = "") => {
  return linkify(text).replace(/\n/g, "<br>");
};

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
    //${escapeHtml(message.message || "")}
    return `
      <div class="message-text">
         ${formatMessage(message.message || "")}
      </div>
    `;
  }
  //<i class="fa-solid ${getMediaIcon(getMediaType(message.mime_type))}"></i>
  if (type !== "text") {
    return `
<div class="message-placeholder">

  <div class="message-placeholder-icon">
    <i class="fa-solid ${getMediaIcon(type)}"></i>
  </div>

  <div class="message-placeholder-content">
    <div class="message-placeholder-title">
      ${escapeHtml(message.file_name || "Document")}
    </div>
  </div>

</div>

${
  message.message?.trim()
    ? `
      <div class="message-caption">
         ${formatMessage(message.message || "")}
      </div>
    `
    : ""
}

${
  message.media_url
    ? `
      <div class="button-option">

        <a
          href="${escapeHtml(message.media_url)}"
          download
          class="downloadDocument"
        >
          <i class="fa-solid fa-download"></i>
          <span>Download</span>
        </a>

        <a
          href="${escapeHtml(message.media_url)}"
          target="_blank"
          class="openDocument"
        >
          <i class="fa-solid fa-up-right-from-square"></i>
          <span>Open</span>
        </a>

      </div>
    `
    : ""
}
  `;
  }
};

const getChatPreview = (last) => {
  if (!last) return "";

  const mediaType = getMediaType(last.mime_type);

  switch (mediaType) {
    case "text":
      return escapeHtml(last.message || "");

    case "image":
      return `<i class="fa-regular fa-image"></i> Photo`;

    case "video":
      return `<i class="fa-solid fa-video"></i> Video`;

    case "audio":
      return `<i class="fa-solid fa-microphone"></i> Audio`;

    case "document":
      return `<i class="fa-regular fa-file-lines"></i> ${escapeHtml(
        last.file_name || "Document"
      )}`;

    case "location":
      return `<i class="fa-solid fa-location-dot"></i> Location`;

    case "contacts":
      return `<i class="fa-regular fa-address-book"></i> Contact`;

    case "sticker":
      return `<i class="fa-regular fa-face-smile"></i> Sticker`;

    default:
      return escapeHtml(last.message || "");
  }
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
      const showTime = last && !last.is_placeholder;

      const timeText = showTime ? formatTime(last.created_at) : "";
      
      // let preview = last?.message || "";

      // const mediaType = getMediaType(last?.mime_type);

      // if (mediaType !== "text") {
      //   preview = `${getMediaLabel(mediaType)} Preview Not Available`;
      // }

      const preview = getChatPreview(last);
      
      //console.log(conversation.phone, conversation.unread_count);
      //<time class="chat-time">${escapeHtml(formatTime(conversation.lastMessage?.created_at))}</time>
      // ${escapeHtml(preview)}
      return `
        <button class="chat-item${isActive}" type="button" data-phone="${escapeHtml(conversation.phone)}">
          <div class="avatar">${escapeHtml(getInitials(conversation.name, conversation.phone))}</div>
          <div>
            <div class="chat-name-row">
              <div class="chat-name">${escapeHtml(conversation.name)}</div>
              <time class="chat-time">${showTime ? escapeHtml(timeText) : ""}</time>
            </div>
            <div class="chat-preview-row">

                <div class="chat-preview">
                  ${preview}
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

const formatDateDivider = (value) => {
  const date = new Date(value);
  const now = new Date();

  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startMsg = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor(
    (startToday - startMsg) / (1000 * 60 * 60 * 24)
  );

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) {
    return date.toLocaleDateString("en-IN", {
      weekday: "long",
    });
  }

  return date.toLocaleDateString("en-GB");
};

function renderMessages() {
  const conversation = conversations.find(
    (item) => item.phone === selectedPhone,
  );

  if (!conversation) {
    messageComposer.classList.remove("show");

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
    <div class="avatar">${escapeHtml(
      getInitials(conversation.name, conversation.phone),
    )}</div>

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

    // console.log("Clear Btn Clicked", selectedPhone);

    const response = await fetch(`/api/messages/clear/${selectedPhone}`, {
      method: "DELETE",
    });

    const result = await response.json();

    // console.log(result);

    await loadMessages();
  });

  const deleteBtn = document.getElementById("deleteContactBtn");

  deleteBtn?.addEventListener("click", async () => {
    if (!confirm("Delete contact?")) return;

    console.log("Delete Btn Clicked", selectedPhone);

    await fetch(`/api/messages/contact/${selectedPhone}`, {
      method: "DELETE",
    });

    selectedPhone = null;
    messageComposer.classList.remove("show");
    await loadMessages();
  });
  
  messageComposer.classList.add("show");

  const realMessages = conversation.messages.filter(
    (m) => !m.is_placeholder,
  );

  if (!realMessages.length) {
    messageList.innerHTML = "";
    return;
  }

  let html = "";
  let lastDivider = "";

  realMessages.forEach((message) => {

    const divider = formatDateDivider(message.created_at);

    if (divider !== lastDivider) {

      lastDivider = divider;

      html += `
        <div
          class="date-divider"
          data-label="${divider}">
          <span>${divider}</span>
        </div>
      `;
    }

    html += `
      <div class="message-row ${escapeHtml(
        message.direction || "incoming",
      )}">

        <article class="message-bubble">

          ${renderMessageContent(message)}

          <time class="message-time">
            ${new Date(message.created_at)
              .toLocaleTimeString("en-IN", {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
              })
              .toLowerCase()}
          </time>

        </article>

      </div>
    `;
  });

  messageList.innerHTML = html;
  
// Wait until browser finishes rendering
requestAnimationFrame(() => {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
});
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
refreshButton.addEventListener("click", async () => {
  closeFilePreview();
  await loadMessages();
});

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

socket.on("connect", () => {});

socket.on("new-message", (msg) => {
  // reload chat automatically
  loadMessages();
});
