import { NextRequest, NextResponse } from "next/server";
import { HfInference } from "@huggingface/inference";
import { promises as fs } from "fs";
import path from "path";

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);

export async function POST(req) {
  try {
    const { company } = await req.json();

    if (!company) {
      return NextResponse.json({ error: "Company name is required" }, { status: 400 });
    }

    // *Load dataset from public folder*
    const filePath = path.join(process.cwd(), "public", "glassdoor_reviews.csv");
    const fileContent = await fs.readFile(filePath, "utf-8");

    // *Convert CSV to JSON (Handle multi-word reviews)*
    const rows = fileContent.split("\n").slice(1);
    const reviews = rows.map((row) => {
      const [company_name, ...review_parts] = row.split(",");
      return { company: company_name?.trim(), review: review_parts.join(",").trim() };
    });

    // *Filter reviews for the selected company*
    const filteredReviews = reviews.filter(r => r.company.toLowerCase() === company.toLowerCase());

    if (filteredReviews.length === 0) {
      return NextResponse.json({ error: "No reviews found for this company" }, { status: 404 });
    }

    // *Merge all reviews into a single text block for AI analysis*
    const reviewText = filteredReviews.map(r => r.review).join(" ");

    // *Hugging Face Emotion Analysis*
    const emotionResult = await hf.textClassification({
      model: "j-hartmann/emotion-english-distilroberta-base",
      inputs: reviewText,
    });

    // *Hugging Face Sentiment Analysis*
    const sentimentResult = await hf.textClassification({
      model: "cardiffnlp/twitter-roberta-base-sentiment",
      inputs: reviewText,
    });

    // *Hugging Face Summarization for Key Insights*
    const summaryResult = await hf.summarization({
      model: "facebook/bart-large-cnn",
      inputs: reviewText,
    });

    // *Extract emotions & Ensure "Love" is included*
    const emotion = emotionResult[0].reduce((acc, curr) => {
      acc[curr.label] = Math.round(curr.score * 100);
      return acc;
    }, {} );
    emotions["Love"] = emotions["Love"] || 0; // Ensure "Love" is always present

    // *Extract sentiment*
    const sentimentScore = sentimentResult[0].reduce((acc, curr) => {
      acc[curr.label] = Math.round(curr.score * 100);
      return acc;
    }, {} );

    // *Extract positive & negative insights from summarization*
    const insights = {
      positive: summaryResult[0]?.summary_text || "No insights found.",
      negative: summaryResult[0]?.summary_text || "No insights found.",
    };

    return NextResponse.json({
      emotions,
      sentiment: {
        Positive: sentimentScores["positive"] || 0,
        Neutral: sentimentScores["neutral"] || 0,
        Negative: sentimentScores["negative"] || 0,
      },
      insights,
    });

  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}