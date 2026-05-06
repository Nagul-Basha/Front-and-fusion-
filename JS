let stream;

// =========================
// TYPEWRITER ANIMATION
// =========================
function typeWriter(element, text, speed = 80, callback) {
    let i = 0;
    element.innerHTML = "";

    function typing() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(typing, speed);
        } else if (callback) {
            callback();
        }
    }

    typing();
}

document.addEventListener("DOMContentLoaded", () => {
    const welcomeTitle = document.querySelector(".welcome-box h1");
    const mainTitle = document.querySelector(".card h2");

    if (welcomeTitle) {
        typeWriter(welcomeTitle, welcomeTitle.innerText, 70);
    }

    if (mainTitle) {
        setTimeout(() => {
            typeWriter(mainTitle, mainTitle.innerText, 60);
        }, 1200);
    }

    // ✅ FIX: AUTO TRANSLATION (IMPORTANT FIX)
    const input = document.getElementById("inputText");
    if (input) {
        let timer;

        input.addEventListener("input", () => {
            autoResize(input);

            clearTimeout(timer);
            timer = setTimeout(() => {
                translateText(); // 🔥 now always works
            }, 500);
        });
    }
});


// =========================
// START APP
// =========================
function startApp() {
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("mainApp").style.display = "flex";
}


// =========================
// MENU
// =========================
function toggleMenu() {
    const menu = document.getElementById("sideMenu");
    const overlay = document.getElementById("overlay");

    menu.classList.toggle("active");
    overlay.classList.toggle("active");
}


// =========================
// DARK MODE
// =========================
function toggleTheme() {
    document.body.classList.toggle("dark");

    localStorage.setItem(
        "theme",
        document.body.classList.contains("dark") ? "dark" : "light"
    );
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("theme") === "dark") {
        document.body.classList.add("dark");
    }
});


// =========================
// HISTORY
// =========================
function saveHistory(input, output) {
    let history = JSON.parse(localStorage.getItem("translatorHistory")) || [];

    history.unshift({ input, output });
    if (history.length > 20) history.pop();

    localStorage.setItem("translatorHistory", JSON.stringify(history));
}

function showHistory() {
    let historyBox = document.getElementById("historyBox");
    let history = JSON.parse(localStorage.getItem("translatorHistory")) || [];

    historyBox.innerHTML = "<h4>History</h4>";

    if (history.length === 0) {
        historyBox.innerHTML += "<p>No history yet</p>";
        return;
    }

    history.forEach(item => {
        historyBox.innerHTML += `
        <div class="history-item">
        <b>Input:</b> ${item.input}<br>
        <b>Output:</b> ${item.output}
        </div>`;
    });
}

function clearHistory() {
    localStorage.removeItem("translatorHistory");
    showHistory();
}


// =========================
// AUTO RESIZE
// =========================
function autoResize(el) {
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
}


// =========================
// SWAP LANG
// =========================
function swapLang() {
    let from = document.getElementById("fromLang");
    let to = document.getElementById("toLang");

    [from.value, to.value] = [to.value, from.value];

    translateText();
}


// =========================
// VOICE INPUT
// =========================
function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        alert("Voice not supported");
        return;
    }

    let recognition = new SpeechRecognition();
    recognition.lang = document.getElementById("fromLang").value;

    recognition.onresult = (e) => {
        document.getElementById("inputText").value = e.results[0][0].transcript;
        autoResize(document.getElementById("inputText"));
        translateText();
    };

    recognition.start();
}


// =========================
// TRANSLATE
// =========================
async function translateText() {
    let text = document.getElementById("inputText").value;
    let from = document.getElementById("fromLang").value;
    let to = document.getElementById("toLang").value;

    if (!text.trim()) {
        document.getElementById("outputText").value = "";
        return;
    }

    try {
        let url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${from}&tl=${to}&dt=t&q=${encodeURIComponent(text)}`;

        let res = await fetch(url);
        let data = await res.json();

        let translated = data[0].map(item => item[0]).join("");

        let output = document.getElementById("outputText");
        output.value = translated;

        autoResize(output);

        saveHistory(text, translated);

    } catch (err) {
        document.getElementById("outputText").value = "Error";
    }
}


// =========================
// SPEAK OUTPUT
// =========================
function speakOutput() {
    let text = document.getElementById("outputText").value;
    if (!text) return;

    let speech = new SpeechSynthesisUtterance(text);
    speech.lang = document.getElementById("toLang").value;

    speechSynthesis.cancel();
    speechSynthesis.speak(speech);
}


// =========================
// CAMERA
// =========================
async function openCamera() {
    const modal = document.getElementById("cameraModal");
    const video = document.getElementById("camera");

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        modal.style.display = "flex";
    } catch (err) {
        alert("Camera error");
    }
}

function closeCamera() {
    const modal = document.getElementById("cameraModal");

    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }

    modal.style.display = "none";
}

async function captureImage() {
    const video = document.getElementById("camera");

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    closeCamera();

    canvas.toBlob(async (blob) => {
        const formData = new FormData();
        formData.append("file", blob);

        try {
            let res = await fetch("https://api.ocr.space/parse/image", {
                method: "POST",
                headers: { "apikey": "helloworld" },
                body: formData
            });

            let data = await res.json();
            let text = data.ParsedResults[0].ParsedText;

            document.getElementById("inputText").value = text;
            autoResize(document.getElementById("inputText"));

            translateText();

        } catch (err) {
            alert("OCR failed");
        }
    }, "image/png");
}


// =========================
// FILE MENU
// =========================
function toggleFileMenu() {
    const popup = document.getElementById("filePopup");
    popup.style.display = popup.style.display === "flex" ? "none" : "flex";
}

function loadFile(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = function(e) {
        const text = e.target.result;
        document.getElementById("inputText").value = text;
        autoResize(document.getElementById("inputText"));
        translateText();
    };

    reader.readAsText(file);
}
