require("dotenv").config();

const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 120)}`);
  }
  return res.json();
}

app.get("/test", (req, res) => {
  res.send("Server is working: testing ");
});
app.get("/api/profile", async (req, res) => {
  try {
    const randomData = await fetchJSON("https://randomuser.me/api/");
    const u = randomData.results[0];

    const user = {
      firstName: u.name.first,
      lastName: u.name.last,
      gender: u.gender,
      age: u.dob.age,
      picture: u.picture.large,
      city: u.location.city,
      country: u.location.country,
      fullAddress: `${u.location.street.name} ${u.location.street.number}`
    };

    let countries = [];
    try {
      countries = await fetchJSON(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(user.country)}?fullText=true`
      );
    } catch (e) {
      countries = await fetchJSON(
        `https://restcountries.com/v3.1/name/${encodeURIComponent(user.country)}`
      );
    }

    const c = countries[0];

    const languagesObj = c.languages || {};
    const currenciesObj = c.currencies || {};

    const languageList = Object.values(languagesObj);

    const currencyCodes = Object.keys(currenciesObj);
    const currencyCode = currencyCodes.length ? currencyCodes[0] : null;
    const currencyName = currencyCode ? (currenciesObj[currencyCode].name || "N/A") : "N/A";

    const country = {
      name: (c.name && c.name.common) ? c.name.common : user.country,
      capital: (c.capital && c.capital.length) ? c.capital[0] : "N/A",
      languages: languageList,
      currencyCode: currencyCode,
      currencyName: currencyName,
      flag: (c.flags && c.flags.png) ? c.flags.png : null
    };

    const exchangeRates = {
      base: currencyCode || "N/A",
      usd: "N/A",
      kzt: "N/A"
    };

    const rateKey = process.env.EXCHANGE_RATE_API_KEY;
    if (!rateKey) {
      exchangeRates.note = "Missing EXCHANGE_RATE_API_KEY in .env";
    } else if (currencyCode) {
      try {
        const rateData = await fetchJSON(
          `https://v6.exchangerate-api.com/v6/${rateKey}/latest/${currencyCode}`
        );

        if (rateData && rateData.conversion_rates) {
          exchangeRates.usd = rateData.conversion_rates.USD || "N/A";
          exchangeRates.kzt = rateData.conversion_rates.KZT || "N/A";
        }
      } catch (e) {
        exchangeRates.note = "ExchangeRate API error";
      }
    }

    const news = {
      query: country.name || user.country,
      articles: []
    };

    const newsKey = process.env.NEWS_API_KEY;
    if (!newsKey) {
      news.note = "Missing NEWS_API_KEY in .env";
    } else {
      try {
        const q = news.query;

        const newsData = await fetchJSON(
          `https://newsapi.org/v2/everything?qInTitle=${encodeURIComponent(q)}&language=en&pageSize=20&sortBy=publishedAt&apiKey=${newsKey}`
        );

        const items = (newsData && Array.isArray(newsData.articles)) ? newsData.articles : [];
        const qLower = String(q).toLowerCase();

        const filtered = items
          .filter(a => String(a && a.title ? a.title : "").toLowerCase().includes(qLower))
          .slice(0, 5);

        news.articles = filtered.map(a => ({
          title: a.title || "No title",
          url: a.url || "",
          source: (a.source && a.source.name) ? a.source.name : "",
          image: a.urlToImage || null
        }));

        if (news.articles.length === 0) {
          news.note = "No news found";
        }
      } catch (e) {
        news.note = "News API unavailable";
      }
    }

    res.json({ user, country, exchangeRates, news });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running: http://localhost:${PORT}`);
});
