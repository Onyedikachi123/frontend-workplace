"use client";

import React, { useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Search,
  Heart,
  BarChart2,
  PieChart,
  AlertCircle,
} from "lucide-react";

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // State variables to store the fetched data
  const [description, setDescription] = useState<string>("");
  const [sentiment, setSentiment] = useState<any>(null); // Assuming sentiment data will be an object
  const [summary, setSummary] = useState<string>("");

  // Sample data - in production, this would come from an API
  const emotionData = [
    { name: "Gratitude", value: 40 },
    { name: "Optimism", value: 30 },
    { name: "Love", value: 15 },
    { name: "Disapproval", value: 10 },
    { name: "Other", value: 5 },
  ];

  const sentimentData = [
    { name: "Positive", value: 65 },
    { name: "Neutral", value: 25 },
    { name: "Negative", value: 10 },
  ];

  const handleSearch = async () => {
    if (!searchQuery) return; // Early return if no search query is entered
  
    setIsLoading(true); // Set loading state to true
  
    try {
      // Fetch data from the API endpoint with the company name as a query parameter
      const response = await fetch(`/api/analyze?company=${encodeURIComponent(searchQuery)}`);
      const data = await response.json(); // Parse the response JSON
  
      if (response.ok) {
        // Update state with fetched data if the request is successful
        setDescription(data.description); // Set description data
        setSentiment(data.sentiment); // Set sentiment data
        setSummary(data.summary); // Set summary data
      } else {
        console.error("Error:", data.error); // Log any errors returned from the API
      }
    } catch (error) {
      // Catch and log any errors that occur during the fetch
      console.error("An error occurred:", error);
    } finally {
      // Set loading state to false after the API call is completed
      setIsLoading(false);
    }
  };
  

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Search Section */}
      <div className="max-w-4xl mx-auto mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Entity Sentiment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Input
                placeholder="Enter company or person name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
              <Button onClick={handleSearch} disabled={isLoading}>
                <Search className="mr-2 h-4 w-4" />
                Analyze
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
              <div className="text-6xl font-bold text-red-500 mb-4">85</div>
              <Progress value={85} className="h-4" />
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
                <div className="font-semibold text-green-700">
                  Positive Mention
                </div>
                <p className="text-green-600">
                  "Outstanding customer service and innovative solutions..."
                </p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="font-semibold text-red-700">
                  Area for Improvement
                </div>
                <p className="text-red-600">
                  "Response times could be faster..."
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
