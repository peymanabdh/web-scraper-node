import puppeteer from "puppeteer";
import fs from "fs";
import { createObjectCsvWriter } from "csv-writer";

const scraping = async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();

  const allGames = [];
  let currentPage = 1;
  const maxPages = 6;

  while (currentPage <= maxPages) {
    const url = `https://doondook.studio/buy-html5-games/page/${currentPage}`;
    await page.goto(url, { timeout: 60000 });

    const games = await page.evaluate(() => {
      const bookElements = document.querySelectorAll(".single-loop-game");
      return Array.from(bookElements).map((book) => {
        const title = book.querySelector(".related-content h3").textContent;
        const text = book.querySelector(".related-content p").textContent;
        const price = book.querySelector(".price").textContent;
        const img = book.querySelector(".image").getAttribute("style");
        const link = book.querySelector(".card a").getAttribute("href");
        const image = img
          .replace("background-image: url('", "")
          .replace("')", "");
        return {
          title,
          text,
          price,
          image,
          link,
        };
      });
    });

    allGames.push(...games);
    console.log(`games on page ${currentPage}: `, games);
    currentPage++;
  }
  const csvWriter = createObjectCsvWriter({
    path: "games.csv",
    header: [
      { id: "title", title: "Title" },
      { id: "text", title: "Description" },
      { id: "price", title: "Price" },
      { id: "image", title: "Image URL" },
      { id: "link", title: "Link" },
    ],
  });

  await csvWriter.writeRecords(allGames);
  fs.writeFileSync("games.json", JSON.stringify(allGames, null, 2));

  console.log("Data saved to games.json");
  console.log("Data saved to games.csv");

  await browser.close();
};

scraping();
