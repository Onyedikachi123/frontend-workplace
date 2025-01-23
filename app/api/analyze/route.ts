import { NextRequest, NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { HfInference } from "@huggingface/inference";

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const company = searchParams.get("company");

  if (!company) {
    return NextResponse.json(
      { error: "Company name is required" },
      { status: 400 }
    );
  }

  try {
    // Step 1: Launch Puppeteer and navigate to the website
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    // Step 2: Open the main page
    await page.goto("https://www.customerservicescoreboard.com/", {
      waitUntil: "domcontentloaded", // Wait for the page to load before continuing
    });

    // Step 3: Search for the company
    await page.type("input[type='text']", company); // Type the company name in the search box
    await page.keyboard.press("Enter"); // Press "Enter" to search

    // Wait for the search results to load
    await page.waitForFunction(
      (company) => {
        const rows = Array.from(document.querySelectorAll("table.rwd-table tbody tr"));
        return rows.some((row) => {
          const companyCell = row.querySelector('td[data-th="company"] a');
          return companyCell && companyCell.textContent?.includes(company);
        });
      },
      {},
      company
    );

    // Step 4: Find and click on the company's link
    let companyLink = await page.$eval(
      'table.rwd-table tbody',
      (tbody: HTMLElement, company) => {
        const rows = Array.from(tbody.querySelectorAll('tr'));
        for (let row of rows) {
          const companyCell = row.querySelector('td[data-th="company"] a');
          if (companyCell && companyCell.textContent?.trim() === company) {
            return companyCell.getAttribute('href');
          }
        }
        return null; // Return null if company is not found
      },
      company
    );

    if (!companyLink) {
      await browser.close();
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Step 5: Check if the link is valid and adjust if necessary
    if (!companyLink.startsWith("http")) {
      companyLink = `https://www.customerservicescoreboard.com${companyLink}`;
    }

    // Step 6: Navigate to the company page with error handling
    try {
      await page.goto(companyLink, {
        waitUntil: "networkidle0", // Wait until network is idle to ensure all content is loaded
      });
    } catch (err) {
      console.error(`Failed to load page: ${companyLink}`, err);
      await browser.close();
      return NextResponse.json(
        { error: `Failed to load company page: ${companyLink}` },
        { status: 500 }
      );
    }

    // Step 7: Extract the description
    const description = await page.$eval(".description.item", (el) =>
      el.textContent?.trim()
    );

    if (!description) {
      await browser.close();
      return NextResponse.json(
        { error: "No description found" },
        { status: 404 }
      );
    }

    // Step 8: Close the browser
    await browser.close();

    // Step 9: Analyze the description using Hugging Face models
    const [sentimentResult, summaryResult] = await Promise.all([
      hf.textClassification({
        model: "siebert/sentiment-roberta-large-english",
        inputs: description,
      }),
      hf.summarization({
        model: "facebook/bart-large-cnn",
        inputs: description,
      }),
    ]);

    // Prepare the response
    const response = {
      company,
      description,
      sentiment: sentimentResult,
      summary: summaryResult.summary_text, // Access summary_text directly
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "An error occurred during processing" },
      { status: 500 }
    );
  }
}
