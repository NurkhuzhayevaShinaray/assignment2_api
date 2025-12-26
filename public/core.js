const btn = document.getElementById("loadUser");
const userCard = document.getElementById("userCard");
const countryCard = document.getElementById("countryCard");
const newsBox = document.getElementById("newsBox");

function escapeHtml(text) {
  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

btn.addEventListener("click", async () => {
  userCard.innerHTML = "Loading...";
  countryCard.innerHTML = "";
  newsBox.innerHTML = "";

  try {
    const res = await fetch("/api/profile");

    if (!res.ok) {
      const errObj = await res.json().catch(() => ({}));
      throw new Error(errObj.error || "Request failed");
    }

    const data = await res.json();

    const user = data.user;
    const country = data.country;
    const exchangeRates = data.exchangeRates;
    const news = data.news;

    renderUser(user);
    renderCountry(country, exchangeRates);
    renderNews(news);
  } catch (e) {
    userCard.innerHTML = `Error<br>${escapeHtml(e.message)}`;
    countryCard.innerHTML = "";
    newsBox.innerHTML = "";
  }
});

function renderUser(user) {
  userCard.innerHTML = `
    <div class="card">
      <img src="${escapeHtml(user.picture)}" width="120" alt="user"/>
      <h2>${escapeHtml(user.firstName)} ${escapeHtml(user.lastName)}</h2>
      <p><b>Gender:</b> ${escapeHtml(user.gender)}</p>
      <p><b>Age:</b> ${escapeHtml(user.age)}</p>
      <p><b>City:</b> ${escapeHtml(user.city)}</p>
      <p><b>Country:</b> ${escapeHtml(user.country)}</p>
      <p><b>Address:</b> ${escapeHtml(user.fullAddress)}</p>
    </div>
  `;
}

function renderCountry(country, exchangeRates) {
  const langs = (country.languages && country.languages.length)
    ? country.languages.join(", ")
    : "N/A";

  const base = (exchangeRates && exchangeRates.base) ? exchangeRates.base : (country.currencyCode || "N/A");
  const usd = (exchangeRates && exchangeRates.usd !== undefined) ? exchangeRates.usd : "N/A";
  const kzt = (exchangeRates && exchangeRates.kzt !== undefined) ? exchangeRates.kzt : "N/A";
  const note = (exchangeRates && exchangeRates.note) ? exchangeRates.note : "";

  countryCard.innerHTML = `
    <div class="card">
      <h2>Country Info</h2>
      ${country.flag ? `<img src="${escapeHtml(country.flag)}" width="120" alt="flag"/>` : ""}
      <p><b>Name:</b> ${escapeHtml(country.name)}</p>
      <p><b>Capital:</b> ${escapeHtml(country.capital)}</p>
      <p><b>Languages:</b> ${escapeHtml(langs)}</p>
      <p><b>Currency:</b> ${escapeHtml(country.currencyCode || "N/A")} (${escapeHtml(country.currencyName)})</p>

      <hr />

      <p><b>Exchange Rates:</b></p>
      <p>1 ${escapeHtml(base)} = ${escapeHtml(usd)} USD</p>
      <p>1 ${escapeHtml(base)} = ${escapeHtml(kzt)} KZT</p>
      ${note ? `<p style="opacity:.7; font-size:12px;">${escapeHtml(note)}</p>` : ""}
    </div>
  `;
}

function renderNews(news) {
  if (!news) {
    newsBox.innerHTML = `
      <div class="card">
        <h2>News</h2>
        <p>No news data.</p>
      </div>
    `;
    return;
  }

  if (news.note) {
    newsBox.innerHTML = `
      <div class="card">
        <h2>News</h2>
        <p>${escapeHtml(news.note)}</p>
      </div>
    `;
    return;
  }

  const articles = news.articles || [];
  if (!articles.length) {
    newsBox.innerHTML = `
      <div class="card">
        <h2>News (Top 5)</h2>
        <p>No articles found.</p>
      </div>
    `;
    return;
  }

  let listHtml = "";
  for (let i = 0; i < articles.length; i++) {
    const a = articles[i];
    listHtml += `
      <li style="margin-bottom:10px;">
        <a href="${escapeHtml(a.url)}" target="_blank" rel="noopener">
          ${escapeHtml(a.title)}
        </a>
        <div style="font-size:12px; opacity:0.7;">${escapeHtml(a.source)}</div>
      </li>
    `;
  }

  newsBox.innerHTML = `
    <div class="card">
      <h2>News (Top 5)</h2>
      <ul style="padding-left:18px; margin:0;">
        ${listHtml}
      </ul>
    </div>
  `;
}
