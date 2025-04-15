import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MoodTracker } from "@/components/dashboard/mood-tracker";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { BarChartIcon, BookIcon, CalendarDaysIcon, PencilIcon } from "lucide-react";
import type { JournalEntry } from "@shared/schema";
import { format, parseISO, startOfMonth, endOfMonth, isSameDay, isSameMonth } from "date-fns";

// Journal entry form schema
const journalEntrySchema = z.object({
  entry: z.string().min(10, "Journal entry must be at least 10 characters"),
  mood: z.string(),
});

export default function JournalPage() {
  const { toast } = useToast();
  const [isNewEntryOpen, setIsNewEntryOpen] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  
  // Fetch journal entries
  const { 
    data: journalEntries, 
    isLoading: isLoadingEntries 
  } = useQuery<JournalEntry[]>({
    queryKey: ["/api/journal"],
  });

  // Form setup
  const journalForm = useForm<z.infer<typeof journalEntrySchema>>({
    resolver: zodResolver(journalEntrySchema),
    defaultValues: {
      entry: "",
      mood: "neutral",
    }
  });

  // Create journal entry mutation
  const createEntryMutation = useMutation({
    mutationFn: async (data: z.infer<typeof journalEntrySchema>) => {
      return await apiRequest("POST", "/api/journal", data);
    },
    onSuccess: () => {
      toast({
        title: "Journal entry saved",
        description: "Your financial reflection has been recorded"
      });
      setIsNewEntryOpen(false);
      journalForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/journal"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save entry",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  });

  // Handle form submission
  const onJournalSubmit = (data: z.infer<typeof journalEntrySchema>) => {
    createEntryMutation.mutate(data);
  };

  // Group entries by month
  const groupEntriesByMonth = (entries: JournalEntry[] | undefined) => {
    if (!entries) return {};
    
    const grouped: Record<string, JournalEntry[]> = {};
    
    entries.forEach(entry => {
      const date = new Date(entry.date);
      const monthYear = format(date, 'MMMM yyyy');
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      
      grouped[monthYear].push(entry);
    });
    
    return grouped;
  };

  const groupedEntries = groupEntriesByMonth(journalEntries);

  // Get mood emoji
  const getMoodEmoji = (mood: string) => {
    switch (mood) {
      case 'sad': return '😞';
      case 'neutral': return '😐';
      case 'happy': return '😊';
      case 'very-happy': return '😄';
      default: return '😐';
    }
  };

  // Get mood label
  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'sad': return 'Stressed';
      case 'neutral': return 'Neutral';
      case 'happy': return 'Content';
      case 'very-happy': return 'Thriving';
      default: return 'Neutral';
    }
  };

  // Calculate mood distribution for the month
  const calculateMoodDistribution = (entries: JournalEntry[] | undefined) => {
    if (!entries || entries.length === 0) return [];
    
    const moodCounts: Record<string, number> = {
      'sad': 0,
      'neutral': 0,
      'happy': 0,
      'very-happy': 0
    };
    
    entries.forEach(entry => {
      if (moodCounts[entry.mood] !== undefined) {
        moodCounts[entry.mood]++;
      }
    });
    
    return [
      { mood: 'sad', count: moodCounts['sad'], label: 'Stressed', emoji: '😞' },
      { mood: 'neutral', count: moodCounts['neutral'], label: 'Neutral', emoji: '😐' },
      { mood: 'happy', count: moodCounts['happy'], label: 'Content', emoji: '😊' },
      { mood: 'very-happy', count: moodCounts['very-happy'], label: 'Thriving', emoji: '😄' },
    ];
  };

  // Get entries for current month
  const getCurrentMonthEntries = () => {
    if (!journalEntries) return [];
    
    const now = new Date();
    const firstDayOfMonth = startOfMonth(now);
    const lastDayOfMonth = endOfMonth(now);
    
    return journalEntries.filter(entry => {
      const entryDate = new Date(entry.date);
      return entryDate >= firstDayOfMonth && entryDate <= lastDayOfMonth;
    });
  };

  const currentMonthEntries = getCurrentMonthEntries();
  const moodDistribution = calculateMoodDistribution(journalEntries);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto bg-background">
        <div className="p-4 md:p-6 max-w-6xl mx-auto">
          {/* Header */}
          <header className="mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-2xl font-bold text-foreground">Financial Mood Journal</h1>
                <p className="text-muted-foreground mt-1">Track how your finances affect your wellbeing</p>
              </div>
              <div className="mt-4 md:mt-0">
                <Button 
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity flex items-center space-x-2"
                  onClick={() => setIsNewEntryOpen(true)}
                >
                  <PencilIcon className="h-4 w-4" />
                  <span>New Journal Entry</span>
                </Button>
              </div>
            </div>
          </header>
          
          {/* Journal Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <CalendarDaysIcon className="h-5 w-5 text-primary" />
                  <CardTitle>This Month</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEntries ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl font-bold">{currentMonthEntries.length}</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      {currentMonthEntries.length === 1 ? "Entry" : "Entries"} recorded
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <BarChartIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Common Mood</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEntries ? (
                  <Skeleton className="h-16" />
                ) : journalEntries && journalEntries.length > 0 ? (
                  <div className="text-center">
                    {(() => {
                      const sortedMoods = [...moodDistribution].sort((a, b) => b.count - a.count);
                      const dominantMood = sortedMoods[0];
                      
                      return (
                        <>
                          <span className="text-4xl">{dominantMood.emoji}</span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {dominantMood.label} ({dominantMood.count} {dominantMood.count === 1 ? "entry" : "entries"})
                          </p>
                        </>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="text-center py-2">
                    <p className="text-sm text-muted-foreground">No entries yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center space-x-2">
                  <BookIcon className="h-5 w-5 text-primary" />
                  <CardTitle>Total Journal</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {isLoadingEntries ? (
                  <Skeleton className="h-16" />
                ) : (
                  <div className="text-center">
                    <span className="text-4xl font-bold">{journalEntries?.length || 0}</span>
                    <p className="text-sm text-muted-foreground mt-1">
                      Total financial reflections
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* MoodTracker and Journal Entries */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-1">
              <MoodTracker className="h-full" />
            </div>
            
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Mood Distribution</CardTitle>
                <CardDescription>
                  How your financial mood has tracked over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoadingEntries ? (
                  <Skeleton className="h-40" />
                ) : journalEntries && journalEntries.length > 0 ? (
                  <div className="grid grid-cols-4 gap-4">
                    {moodDistribution.map(item => (
                      <div key={item.mood} className="text-center">
                        <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center text-2xl ${
                          item.count > 0 ? "bg-primary/10" : "bg-muted"
                        }`}>
                          {item.emoji}
                        </div>
                        <p className="mt-2 font-medium">{item.label}</p>
                        <p className="text-sm text-muted-foreground">{item.count} entries</p>
                        <div className="mt-2 h-24 bg-muted rounded-full w-4 mx-auto overflow-hidden">
                          <div 
                            className="bg-primary w-full rounded-full" 
                            style={{ 
                              height: `${journalEntries.length > 0 
                                ? (item.count / journalEntries.length) * 100 
                                : 0}%`
                            }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">Add journal entries to see mood distribution</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Journal Entries List */}
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-4">Journal Entries</h2>
            
            {isLoadingEntries ? (
              <div className="space-y-4">
                <Skeleton className="h-40" />
                <Skeleton className="h-40" />
              </div>
            ) : journalEntries && journalEntries.length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedEntries)
                  .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
                  .map(([month, entries]) => (
                    <div key={month}>
                      <h3 className="text-md font-medium mb-4 border-b pb-2">{month}</h3>
                      <div className="space-y-4">
                        {entries
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((entry) => (
                            <Card 
                              key={entry.id} 
                              className="hover:shadow-md transition-shadow cursor-pointer"
                              onClick={() => setSelectedEntry(entry)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start">
                                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg bg-primary/10 mr-3 flex-shrink-0">
                                    <span>{getMoodEmoji(entry.mood)}</span>
                                  </div>
                                  <div className="flex-grow">
                                    <div className="flex justify-between">
                                      <p className="font-medium">{getMoodLabel(entry.mood)}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {format(new Date(entry.date), "MMM d, yyyy h:mm a")}
                                      </p>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                                      {entry.entry}
                                    </p>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg shadow-sm">
                <BookIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No journal entries yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking your financial wellbeing by creating your first entry
                </p>
                <Button 
                  onClick={() => setIsNewEntryOpen(true)}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Create Your First Entry
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* New Journal Entry Dialog */}
      <Dialog open={isNewEntryOpen} onOpenChange={setIsNewEntryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Journal Entry</DialogTitle>
            <DialogDescription>
              Reflect on how you're feeling about your finances today.
            </DialogDescription>
          </DialogHeader>
          
          <Form {...journalForm}>
            <form onSubmit={journalForm.handleSubmit(onJournalSubmit)} className="space-y-4">
              <FormField
                control={journalForm.control}
                name="entry"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your thoughts</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="How are you feeling about your finances today?" 
                        className="min-h-32 resize-none"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={journalForm.control}
                name="mood"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your mood</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="How are you feeling?" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="sad">😞 Stressed</SelectItem>
                        <SelectItem value="neutral">😐 Neutral</SelectItem>
                        <SelectItem value="happy">😊 Content</SelectItem>
                        <SelectItem value="very-happy">😄 Thriving</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsNewEntryOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEntryMutation.isPending}
                >
                  {createEntryMutation.isPending ? "Saving..." : "Save Entry"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* View Journal Entry Dialog */}
      <Dialog 
        open={selectedEntry !== null} 
        onOpenChange={(open) => !open && setSelectedEntry(null)}
      >
        <DialogContent>
          {selectedEntry && (
            <>
              <DialogHeader>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getMoodEmoji(selectedEntry.mood)}</span>
                  <DialogTitle>{getMoodLabel(selectedEntry.mood)}</DialogTitle>
                </div>
                <DialogDescription>
                  {format(new Date(selectedEntry.date), "EEEE, MMMM d, yyyy 'at' h:mm a")}
                </DialogDescription>
              </DialogHeader>
              
              <div className="mt-2 mb-6">
                <p className="whitespace-pre-wrap">{selectedEntry.entry}</p>
              </div>
              
              <DialogFooter>
                <Button 
                  onClick={() => setSelectedEntry(null)}
                >
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
