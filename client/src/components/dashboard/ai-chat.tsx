import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SendIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { AiAdvice } from "@shared/schema";

export function AiChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  
  // Fetch previous AI advice
  const { data: advices, isLoading: isLoadingAdvices } = useQuery<AiAdvice[]>({
    queryKey: ["/api/ai/advice"],
  });

  // AI advice mutation
  const adviceMutation = useMutation({
    mutationFn: async (query: string) => {
      const res = await apiRequest("POST", "/api/ai/advice", { query });
      return await res.json();
    },
    onSuccess: () => {
      setQuery("");
      queryClient.invalidateQueries({ queryKey: ["/api/ai/advice"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to get advice",
        description: (error as Error).message,
        variant: "destructive",
      });
    },
  });

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [advices]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() === "") return;
    
    adviceMutation.mutate(query);
  };

  // Format initials for avatar
  const getUserInitials = () => {
    if (!user) return "U";
    return user.name.split(" ").map(n => n[0]).join("").toUpperCase();
  };

  // Reverse advices array for display (newest first)
  const sortedAdvices = advices ? [...advices].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  ) : [];

  return (
    <div className="flex-grow flex flex-col h-full">
      <ScrollArea className="flex-grow mb-4 pr-2" ref={scrollAreaRef}>
        <div className="space-y-4">
          {/* Welcome message */}
          {!isLoadingAdvices && sortedAdvices.length === 0 && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-white font-semibold text-sm">N</span>
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                <p className="text-sm text-foreground">
                  Hi {user?.name?.split(" ")[0] || "there"}! I'm your NeuroBank financial assistant. 
                  How can I help you with your finances today?
                </p>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoadingAdvices && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          )}

          {/* Chat history */}
          {sortedAdvices.map((advice, index) => (
            <div key={advice.id}>
              {/* User query */}
              <div className="flex items-start justify-end">
                <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl rounded-tr-none p-3 max-w-[85%]">
                  <p className="text-sm text-white">{advice.query}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center ml-2 flex-shrink-0">
                  <span className="text-muted-foreground font-semibold text-sm">{getUserInitials()}</span>
                </div>
              </div>

              {/* AI response */}
              <div className="flex items-start mt-4">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-2 flex-shrink-0">
                  <span className="text-white font-semibold text-sm">N</span>
                </div>
                <div className="bg-muted rounded-2xl rounded-tl-none p-3 max-w-[85%]">
                  <div className="text-sm text-foreground" dangerouslySetInnerHTML={{ __html: advice.response }} />
                </div>
              </div>
            </div>
          ))}

          {/* Loading new response */}
          {adviceMutation.isPending && (
            <div className="flex items-start">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center mr-2 flex-shrink-0">
                <span className="text-white font-semibold text-sm">N</span>
              </div>
              <div className="bg-muted rounded-2xl rounded-tl-none p-3">
                <div className="flex items-center space-x-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <div className="h-2 w-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      
      <form onSubmit={handleSubmit} className="relative">
        <Input
          type="text"
          placeholder="Ask me anything about your finances..."
          className="w-full p-3 pr-12 bg-muted border-none rounded-full focus:ring-2 focus:ring-primary focus:outline-none text-sm"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={adviceMutation.isPending}
        />
        <Button
          type="submit"
          size="icon"
          className="absolute right-2 top-1/2 transform -translate-y-1/2 w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary text-white"
          disabled={query.trim() === "" || adviceMutation.isPending}
        >
          {adviceMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
