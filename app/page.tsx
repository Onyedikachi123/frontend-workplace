"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Search, Heart, BarChart2, PieChart, AlertCircle } from "lucide-react";

// Define data types
interface EmotionData {
  name: string;
  value: number;
}

interface SentimentData {
  name: string;
  value: number;
}

const Dashboard: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [emotionData, setEmotionData] = useState<EmotionData[]>([]);
  const [sentimentData, setSentimentData] = useState<SentimentData[]>([]);
  const [loveScore, setLoveScore] = useState<number>(0);
  const [keyInsights, setKeyInsights] = useState<{ positive: string; negative: string }>({
    positive: "",
    negative: "",
  });

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ company: searchQuery }),
      });

      const data = await response.json();

      if (response.ok) {
        setEmotionData([
          { name: "Gratitude", value: data.emotions.Gratitude || 0 },
          { name: "Optimism", value: data.emotions.Optimism || 0 },
          { name: "Love", value: data.emotions.Love || 0 },
          { name: "Disapproval", value: data.emotions.Disapproval || 0 },
          { name: "Other", value: data.emotions.Other || 0 },
        ]);

        setSentimentData([
          { name: "Positive", value: data.sentiment.Positive || 0 },
          { name: "Neutral", value: data.sentiment.Neutral || 0 },
          { name: "Negative", value: data.sentiment.Negative || 0 },
        ]);

        // Set Love Score
        setLoveScore(data.emotions.Love || 0);

        // Set Key Insights
        setKeyInsights({
          positive: data.insights.positive || "No positive feedback found.",
          negative: data.insights.negative || "No negative feedback found.",
        });
      } else {
        alert(data.error || "Failed to fetch data.");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">Entity Sentiment Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter company name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                {isLoading ? "Analyzing..." : "Analyze"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Love Score Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Heart className="mr-2 text-red-500" />
              Love Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <div className="text-6xl font-bold text-red-500 mb-4">{loveScore}</div>
              <Progress value={loveScore} className="h-4" />
            </div>
          </CardContent>
        </Card>

        {/* Sentiment Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2" />
              Sentiment Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sentimentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4f46e5" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Emotion Analysis Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart2 className="mr-2" />
              Emotion Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={emotionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Key Insights Card */}
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="mr-2" />
              Key Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="font-semibold text-green-700">Positive Mention</div>
                <p className="text-green-600">
                  {keyInsights.positive}
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold text-red-700">Area for Improvement</div>
                <p className="text-red-600">
                  {keyInsights.negative}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;