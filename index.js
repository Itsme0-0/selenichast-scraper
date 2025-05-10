const express = require("express");
const bodyParser = require("body-parser");
const puppeteer = require("puppeteer");

const app = express();
app.use(bodyParser.json());

app.post("/", async (req, res) => {
  const { selenichast_url } = req.body;

  if (!selenichast_url) {
    return res.status(400).json({ error: "Missing selenichast_url" });
  }

  try {
    const browser = await puppeteer.launch({
      headless: "new",
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(selenichast_url, { waitUntil: "networkidle2" });

    await page.waitForSelector(".jdgm-rev", { timeout: 10000 });

    const reviews = await page.$$eval(".jdgm-rev", nodes =>
      nodes.map(node => {
        const rating = node.querySelector(".jdgm-rev__rating")?.getAttribute("data-score");
        const body = node.querySelector(".jdgm-rev__body")?.innerText?.trim();
        return rating && body ? { rating: parseFloat(rating), body } : null;
      }).filter(Boolean)
    );

    await browser.close();
    res.json(reviews);
  } catch (err) {
    console.error("SCRAPER ERROR:", err);
    res.status(500).json({ error: "Failed to scrape", details: err.message });
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("✅ Server running");
});
