import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  SmilePlusIcon,
  FrownIcon,
  MehIcon,
  SmileIcon,
  LaughIcon,
  BrainCircuitIcon,
  ArrowRightIcon,
  BarChart4Icon
} from "lucide-react";
import { type JournalEntry } from "@shared/schema";

// Mood Types
type Mood = "sad" | "neutral" | "happy" | "very-happy";

interface MoodOption {
  value: Mood;
  emoji: React.ReactNode;
  label: string;
  color: string;
}

const moodOptions: MoodOption[] = [
  { 
    value: "sad", 
    emoji: <FrownIcon className="h-10 w-10" />, 
    label: "Anxious",
    color: "text-red-500"
  },
  { 
    value: "neutral", 
    emoji: <MehIcon className="h-10 w-10" />, 
    label: "Okay",
    color: "text-amber-500"
  },
  { 
    value: "happy", 
    emoji: <SmileIcon className="h-10 w-10" />, 
    label: "Content",
    color: "text-green-500"
  },
  { 
    value: "very-happy", 
    emoji: <LaughIcon className="h-10 w-10" />, 
    label: "Thriving",
    color: "text-emerald-500"
  }
];

export default function MoodPage() {
  const [selectedTab, setSelectedTab] = useState("track");
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [journalEntry, setJournalEntry] = useState("");
  const [date, setDate] = useState<Date>(new Date());
  const { toast } = useToast();

  // Fetch journal entries
  const { data: journalEntries = [] } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  // Create journal entry mutation
  const createEntryMutation = useMutation<JournalEntry, Error, { entry: string; mood: Mood; date: string }>({
    mutationFn: async (data) => {
      const res = await apiRequest("POST", "/api/journal", data);
      return await res.json();
    },
    onSuccess: () => {
      setSelectedMood(null);
      setJournalEntry("");
      toast({
        title: "Entry saved",
        description: "Your mood journal entry has been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Error saving entry",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedMood) {
      toast({
        title: "Select a mood",
        description: "Please select how you're feeling today.",
        variant: "destructive",
      });
      return;
    }

    if (!journalEntry.trim()) {
      toast({
        title: "Add an entry",
        description: "Please write something about your financial feelings.",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      entry: journalEntry,
      mood: selectedMood,
      date: date.toISOString(),
    });
  };

  // Find mood for a specific day
  const findMoodForDay = (date: Date): Mood | null => {
    const dateString = date.toISOString().split('T')[0];
    
    const entry = journalEntries.find(entry => {
      // Make sure entry.date is not null before creating a Date
      const entryDate = entry.date ? new Date(entry.date).toISOString().split('T')[0] : "";
      return entryDate === dateString;
    });
    
    return entry ? entry.mood as Mood : null;
  };

  const renderMoodForDay = (day: Date) => {
    const mood = findMoodForDay(day);
    if (!mood) return null;

    const moodOption = moodOptions.find(option => option.value === mood);
    if (!moodOption) return null;

    return (
      <div className={`absolute top-0 right-0 p-0.5 ${moodOption.color}`}>
        <div className="h-2 w-2 rounded-full bg-current" />
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <main className="flex-1 p-6 lg:p-8">
        <div className="mx-auto max-w-7xl space-y-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mood Budgeting</h1>
            <p className="text-muted-foreground mt-1">
              Track your emotions and discover how they impact your spending habits
            </p>
          </div>

          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="track">
                <SmilePlusIcon className="mr-2 h-4 w-4" />
                Track Mood
              </TabsTrigger>
              <TabsTrigger value="insights">
                <BarChart4Icon className="mr-2 h-4 w-4" />
                Insights
              </TabsTrigger>
            </TabsList>

            <TabsContent value="track" className="space-y-6 mt-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>How are you feeling about your finances today?</CardTitle>
                    <CardDescription>
                      Select the emotion that best reflects your financial mood
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {moodOptions.map((option) => (
                        <Button
                          key={option.value}
                          variant={selectedMood === option.value ? "default" : "outline"}
                          className="h-auto flex-col py-4 space-y-2"
                          onClick={() => setSelectedMood(option.value)}
                        >
                          <div className={option.color}>{option.emoji}</div>
                          <span>{option.label}</span>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Journal Entry</CardTitle>
                    <CardDescription>
                      Reflect on what's influencing your financial emotions today
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea
                      placeholder="What's making you feel this way about your finances today?"
                      className="min-h-[150px]"
                      value={journalEntry}
                      onChange={(e) => setJournalEntry(e.target.value)}
                    />
                    <Button 
                      onClick={handleSubmit} 
                      className="w-full"
                      disabled={createEntryMutation.isPending}
                    >
                      {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                    </Button>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Your Mood Calendar</CardTitle>
                  <CardDescription>
                    Track how your financial emotions change throughout the month
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(newDate) => newDate && setDate(newDate)}
                    className="mx-auto"
                    components={{
                      DayContent: (props) => (
                        <div className="relative">
                          {props.date.getDate()}
                          {renderMoodForDay(props.date)}
                        </div>
                      ),
                    }}
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              <Card>
                <CardHeader className="flex flex-row items-center gap-4">
                  <BrainCircuitIcon className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle>AI-Powered Mood Analysis</CardTitle>
                    <CardDescription>
                      Discover patterns between your mood and spending behavior
                    </CardDescription>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {journalEntries.length === 0 ? (
                    <div className="text-center py-6">
                      <SmilePlusIcon className="mx-auto h-12 w-12 text-muted-foreground opacity-50" />
                      <p className="mt-4 text-muted-foreground">
                        Start tracking your mood to generate insights
                      </p>
                      <Button 
                        className="mt-4" 
                        variant="outline"
                        onClick={() => setSelectedTab("track")}
                      >
                        Track Your Mood
                        <ArrowRightIcon className="ml-2 h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Emotional Spending Patterns</h3>
                        <p className="text-sm text-muted-foreground">
                          Based on your journal entries, we've noticed you tend to spend more when feeling anxious about finances.
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Impact on Saving Goals</h3>
                        <p className="text-sm text-muted-foreground">
                          Your most positive financial days correlate with progress toward your savings goals.
                        </p>
                      </div>
                      
                      <div className="rounded-lg border p-4">
                        <h3 className="font-medium mb-2">Recommended Actions</h3>
                        <ul className="text-sm text-muted-foreground space-y-2">
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                              <CheckIcon className="h-3 w-3 text-primary" />
                            </div>
                            <span>Schedule purchases for days when you're feeling content rather than anxious</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                              <CheckIcon className="h-3 w-3 text-primary" />
                            </div>
                            <span>Create a "mood budget" with flexibility for emotional spending</span>
                          </li>
                          <li className="flex items-start gap-2">
                            <div className="rounded-full bg-primary/10 p-1 mt-0.5">
                              <CheckIcon className="h-3 w-3 text-primary" />
                            </div>
                            <span>Try the 24-hour rule for purchases when feeling financially anxious</span>
                          </li>
                        </ul>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

// Small utility components
const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);