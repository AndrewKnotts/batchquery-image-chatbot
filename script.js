const imageInput = document.getElementById("imageUpload");
const questionInput = document.getElementById("userQuestion");
const submitBtn = document.getElementById("submitBtn");
const chatContainer = document.getElementById("chatContainer");
const errorMessage = document.getElementById("errorMessage");
const clearChatBtn = document.getElementById("clearChatBtn");
const uploadArea = document.getElementById("uploadArea");

let selectedFiles = [];

function showError(msg) {
  errorMessage.innerText = msg;
  errorMessage.classList.add("errorVisible");

  setTimeout(() => {
    errorMessage.classList.remove("errorVisible");
    setTimeout(() => (errorMessage.innerText = ""), 400);
  }, 4000);
}

function renderPreviews() {
  uploadArea.innerHTML = "";
  selectedFiles.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = () => {
      const wrapper = document.createElement("div");
      wrapper.classList.add("image-preview");

      const img = document.createElement("img");
      img.src = reader.result;

      const removeBtn = document.createElement("button");
      removeBtn.classList.add("remove-btn");
      removeBtn.innerText = "×";
      removeBtn.onclick = () => {
        selectedFiles = selectedFiles.filter((f) => f !== file);
        renderPreviews();
        validateInputs();
      };

      wrapper.appendChild(img);
      wrapper.appendChild(removeBtn);
      uploadArea.appendChild(wrapper);
    };
    reader.readAsDataURL(file);
  });
}

imageInput.addEventListener("change", (e) => {
  const newFiles = Array.from(e.target.files);
  const total = selectedFiles.length + newFiles.length;

  if (total > 4) {
    const allowed = 4 - selectedFiles.length;
    showError(`You can only upload up to 4 images`);
    selectedFiles.push(...newFiles.slice(0, allowed));
  } else {
    selectedFiles.push(...newFiles);
  }

  renderPreviews();
  validateInputs();
  imageInput.value = ""; // allow re-upload of same file if needed
});

questionInput.addEventListener("input", validateInputs);

questionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !submitBtn.disabled) {
    e.preventDefault(); // Prevent form submission if inside a form
    submitBtn.click();
  }
});

function validateInputs() {
  // submitBtn.disabled = !(questionInput.value.trim() && selectedFiles.length);
}

clearChatBtn.addEventListener("click", () => {
  chatContainer.innerHTML = "";
  selectedFiles = [];
  uploadArea.innerHTML = "";
  imageInput.value = "";
  questionInput.value = "";
  // submitBtn.disabled = true;
});

submitBtn.addEventListener("click", async () => {
  const question = questionInput.value.trim();

  if (!question && selectedFiles.length === 0) {
    showError("Please upload images and ask a question.");
    return;
  } else if (!question) {
    showError("Please enter a question.");
    return;
  } else if (selectedFiles.length === 0) {
    showError("Please upload at least one image.");
    return;
  }

  document.querySelector(".app-container").classList.remove("intro-mode");

  const userBubble = document.createElement("div");
  userBubble.className = "chat-bubble user";
  userBubble.innerHTML = `<div>${question}</div>`;
  chatContainer.appendChild(userBubble);

  const botBubble = document.createElement("div");
  botBubble.className = "chat-bubble bot";
  botBubble.innerHTML = `<div><div class="svg-loader">
  <svg width="80" height="80" viewBox="0 0 217 217" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path class="loader-path"
      d="M39.426 151.149L15.3843 127.107C5.23072 116.954 5.23072 100.492 15.3843 90.3379L90.3377 15.3846C100.491 5.23093 116.954 5.23093 127.107 15.3846L202.061 90.3379C212.214 100.492 212.214 116.954 202.061 127.107L127.107 202.061C116.954 212.214 100.491 212.214 90.3377 202.061L63.8212 175.544"
      stroke="black" stroke-width="14" />
    <circle class="loader-path"
      cx="109.083" cy="109.083" r="34.7779"
      transform="rotate(135 109.083 109.083)"
      stroke="black" stroke-width="14" />
    <path class="loader-path"
      d="M80.1523 135.172L17.1523 198.172"
      stroke="black" stroke-width="14" stroke-linecap="round" />
  </svg>
</div></div>`;
  chatContainer.appendChild(botBubble);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  const openaiApiKey =
    "OPENAIKEY"; // Replace with your actual key
  let responsesHTML = "";

  questionInput.value = "";
  uploadArea.innerHTML = "";

  for (let i = 0; i < selectedFiles.length; i++) {
    const file = selectedFiles[i];
    const reader = new FileReader();

    await new Promise((resolve) => {
      reader.onload = async () => {
        const base64Only = reader.result.split(",")[1];
        const imageDataUrl = `data:${file.type};base64,${base64Only}`;

        const payload = {
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                { type: "image_url", image_url: { url: imageDataUrl } },
                { type: "text", text: question },
              ],
            },
          ],
          max_tokens: 500,
        };

        try {
          const res = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${openaiApiKey}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          const reply = data.choices?.[0]?.message?.content || "No response.";

          responsesHTML += `
            <div class="image-response">
              <img src="${imageDataUrl}" />
              <p><strong>Image ${i + 1}:</strong> ${reply}</p>
            </div>
          `;
        } catch (err) {
          responsesHTML += `
            <div class="image-response">
              <p><strong>Image ${i + 1}:</strong> Error: ${err.message}</p>
            </div>
          `;
        }

        resolve();
      };
      reader.readAsDataURL(file);
    });
  }

  botBubble.innerHTML = `${responsesHTML}`;
  chatContainer.scrollTop = chatContainer.scrollHeight;

  selectedFiles = [];
  uploadArea.innerHTML = "";
  imageInput.value = "";
  questionInput.value = "";
  // submitBtn.disabled = true;
});

const autoResize = (el) => {
  el.style.height = "auto"; // reset
  el.style.height = el.scrollHeight + "px"; // expand
};

userQuestion.addEventListener("input", () => {
  autoResize(userQuestion);
  validateInputs();
});
