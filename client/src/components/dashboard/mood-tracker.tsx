import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { JournalEntry } from "@shared/schema";
import { format, startOfWeek, addDays, isSameDay } from "date-fns";

interface MoodTrackerProps {
  className?: string;
}

type Mood = "sad" | "neutral" | "happy" | "very-happy";

interface MoodOption {
  value: Mood;
  emoji: string;
  label: string;
}

const moodOptions: MoodOption[] = [
  { value: "sad", emoji: "😞", label: "Stressed" },
  { value: "neutral", emoji: "😐", label: "Neutral" },
  { value: "happy", emoji: "😊", label: "Content" },
  { value: "very-happy", emoji: "😄", label: "Thriving" },
];

export function MoodTracker({ className }: MoodTrackerProps) {
  const { toast } = useToast();
  const [entry, setEntry] = useState("");
  const [selectedMood, setSelectedMood] = useState<Mood>("neutral");

  // Fetch journal entries
  const { data: journalEntries, isLoading } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: { entry: string; mood: Mood }) => {
      const res = await apiRequest("POST", "/api/journal", data);
      return await res.json();
    },
    onSuccess: () => {
      setEntry("");
      toast({
        title: "Journal entry saved",
        description: "Your financial reflection has been recorded.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save entry",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (entry.trim() === "") {
      toast({
        title: "Entry required",
        description: "Please write a reflection before submitting.",
        variant: "destructive",
      });
      return;
    }

    createEntryMutation.mutate({
      entry: entry.trim(),
      mood: selectedMood,
    });
  };

  // Get week days for the mood tracker
  const getWeekDays = () => {
    const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }); // Start on Monday
    const days = [];

    for (let i = 0; i < 7; i++) {
      const date = addDays(startDate, i);
      days.push({
        date,
        dayName: format(date, "EEE").substring(0, 3),
        isToday: isSameDay(date, new Date()),
      });
    }

    return days;
  };

  // Find mood for a specific day
  const findMoodForDay = (date: Date): Mood | null => {
    if (!journalEntries) return null;

    const entry = journalEntries.find(entry => 
      isSameDay(new Date(entry.date), date)
    );

    return entry ? entry.mood as Mood : null;
  };

  const weekDays = getWeekDays();

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>Financial Mood Journal</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="w-full h-12 mb-4" />
          <div className="flex justify-between items-center mb-6">
            {[...Array(7)].map((_, i) => (
              <Skeleton key={i} className="w-10 h-10 rounded-full" />
            ))}
          </div>
          <Skeleton className="w-full h-24" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Financial Mood Journal</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-muted-foreground">This week's mood</h3>
            <Button variant="link" size="sm" className="text-xs text-primary font-medium p-0 h-auto">
              View Journal
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            {weekDays.map((day) => {
              const mood = findMoodForDay(day.date);
              const emoji = mood ? moodOptions.find(m => m.value === mood)?.emoji : "?";
              
              return (
                <div key={day.dayName} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    day.isToday 
                      ? "bg-gradient-to-r from-primary to-secondary text-white" 
                      : mood 
                        ? "bg-muted" 
                        : "bg-muted/50 text-muted-foreground"
                  }`}>
                    <span>{emoji}</span>
                  </div>
                  <span className={`text-xs ${day.isToday ? "font-medium text-primary" : "text-muted-foreground"}`}>
                    {day.dayName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
        
        <Separator className="my-4" />
        
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-3">Today's reflection</h3>
          <div className="relative">
            <Textarea
              placeholder="How did you feel about your finances today?"
              className="w-full p-3 bg-muted border-none rounded-xl focus:ring-2 focus:ring-primary focus:outline-none text-sm resize-none min-h-24"
              value={entry}
              onChange={(e) => setEntry(e.target.value)}
            />
            <div className="absolute bottom-3 right-3 flex space-x-2">
              {moodOptions.map((mood) => (
                <Button
                  key={mood.value}
                  type="button"
                  size="icon"
                  variant="ghost"
                  className={`w-8 h-8 rounded-full ${
                    selectedMood === mood.value
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "bg-muted/70 text-muted-foreground hover:bg-muted"
                  }`}
                  onClick={() => setSelectedMood(mood.value)}
                >
                  <span>{mood.emoji}</span>
                </Button>
              ))}
            </div>
            <Button
              className="absolute bottom-3 left-3"
              size="sm"
              onClick={handleSubmit}
              disabled={createEntryMutation.isPending}
            >
              {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
