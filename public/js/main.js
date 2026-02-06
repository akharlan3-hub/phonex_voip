const translations = {
  en: {
    hero_title: "VoIP Solutions<br>& Termination",
    hero_subtitle: "Global call routing,<br>stable quality and smart solutions.",
    contact_btn: "Contact us",

    why_title: "Why PhoneX",
    contact_title: "Get in touch",
    contact_hint: "Ready to connect? Leave a request below 👇",

    form_name: "Name",
    form_email: "Email",
    form_telegram: "Telegram",
    form_submit: "Send request"
  },

  ru: {
    hero_title: "VoIP решения<br>и терминация",
    hero_subtitle: "Глобальная маршрутизация звонков,<br>стабильное качество и умные решения.",
    contact_btn: "Связаться",

    why_title: "Почему PhoneX",
    contact_title: "Связаться с нами",
    contact_hint: "Готовы подключиться? Оставьте заявку ниже 👇",

    form_name: "Имя",
    form_email: "Email",
    form_telegram: "Telegram",
    form_submit: "Отправить"
  }
};

function setLanguage(lang) {
  const dict = translations[lang];
  if (!dict) return;

  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    if (dict[key]) el.innerHTML = dict[key];
  });

  document.querySelector("input[name='name']").placeholder = dict.form_name;
  document.querySelector("input[name='email']").placeholder = dict.form_email;
  document.querySelector("input[name='telegram']").placeholder = dict.form_telegram;

  localStorage.setItem("lang", lang);
}

console.log("✅ main.js подключен");

document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector(".contact-form");
  if (!form) {
    console.error("❌ Форма не найдена");
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    console.log("📨 submit формы");

    const formData = new FormData(form);

    const payload = {
      name: formData.get("name"),
      email: formData.get("email"),
      telegram: formData.get("telegram"),
      page: window.location.href
    };

    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      console.log("Ответ сервера:", data);

      if (!data.success) throw new Error("Server error");

      alert("Заявка отправлена!");
      form.reset();

    } catch (err) {
      console.error("❌ Ошибка отправки:", err);
      alert("Ошибка отправки");
    }
  });
});
