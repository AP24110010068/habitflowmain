import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Search, Plus, Users, Trophy, MessageCircle, Upload, Camera } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  category: string;
  member_count: number;
  creator_id: string;
}

const Challenges = () => {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [joinedIds, setJoinedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [newChallenge, setNewChallenge] = useState({ title: "", description: "" });
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [completingChallenge, setCompletingChallenge] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
    fetchJoinedChallenges();
  }, []);

  const fetchChallenges = async () => {
    const { data } = await supabase
      .from("challenges")
      .select("*")
      .eq("is_public", true)
      .order("created_at", { ascending: false });
    setChallenges(data || []);
  };

  const fetchJoinedChallenges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("challenge_members")
      .select("challenge_id")
      .eq("user_id", user.id);
    setJoinedIds(data?.map(m => m.challenge_id) || []);
  };

  const handleCreateChallenge = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("challenges")
      .insert({
        title: newChallenge.title,
        description: newChallenge.description,
        creator_id: user.id,
      })
      .select()
      .single();

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    // Auto-join created challenge
    await supabase.from("challenge_members").insert({
      challenge_id: data.id,
      user_id: user.id,
    });

    toast({ title: "Success! ✨", description: "Challenge created successfully!" });
    setIsCreateOpen(false);
    setNewChallenge({ title: "", description: "" });
    fetchChallenges();
    fetchJoinedChallenges();
  };

  const handleJoinChallenge = async (challengeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("challenge_members").insert({
      challenge_id: challengeId,
      user_id: user.id,
    });

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Joined! 🎉", description: "You've joined the challenge!" });
    fetchChallenges();
    fetchJoinedChallenges();
  };

  const handleCompleteWithPhoto = async () => {
    if (!completingChallenge || !photoFile) {
      toast({ title: "Error", description: "Please select a photo", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // For now, store photo as base64 data URL (in production, use storage bucket)
    const reader = new FileReader();
    reader.onload = async () => {
      const { error } = await supabase.from("completions").insert({
        challenge_id: completingChallenge,
        user_id: user.id,
        photo_url: reader.result as string,
      });

      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
        return;
      }

      toast({ title: "Completed! 🏆", description: "You earned 10 points!" });
      setCompletingChallenge(null);
      setPhotoFile(null);
    };
    reader.readAsDataURL(photoFile);
  };

  const openChat = async (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsChatOpen(true);

    const { data } = await supabase
      .from("chat_messages")
      .select("*, profiles(username)")
      .eq("challenge_id", challenge.id)
      .order("created_at", { ascending: true });
    setChatMessages(data || []);

    // Subscribe to new messages
    const channel = supabase
      .channel(`chat-${challenge.id}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "chat_messages", filter: `challenge_id=eq.${challenge.id}` },
        async (payload) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("username")
            .eq("user_id", payload.new.user_id)
            .single();
          setChatMessages(prev => [...prev, { ...payload.new, profiles: profile }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChallenge) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from("chat_messages").insert({
      challenge_id: selectedChallenge.id,
      user_id: user.id,
      message: newMessage,
    });

    setNewMessage("");
  };

  const filteredChallenges = challenges.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold">Challenges</h1>
            <p className="text-muted-foreground">Discover and join challenges</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-display">Create New Challenge</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Title</Label>
                  <Input
                    placeholder="e.g., 30 Days of Meditation"
                    value={newChallenge.title}
                    onChange={(e) => setNewChallenge({ ...newChallenge, title: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your challenge..."
                    value={newChallenge.description}
                    onChange={(e) => setNewChallenge({ ...newChallenge, description: e.target.value })}
                    className="bg-muted/50"
                  />
                </div>
                <Button onClick={handleCreateChallenge} className="w-full bg-gradient-to-r from-primary to-secondary">
                  Create Challenge
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 h-12 bg-muted/30 border-border/50"
          />
        </div>

        {/* Challenges Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChallenges.map((challenge, index) => {
            const isJoined = joinedIds.includes(challenge.id);
            return (
              <div
                key={challenge.id}
                className="glass-card p-5 hover-glow animate-fade-in"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="w-4 h-4" />
                    <span>{challenge.member_count}</span>
                  </div>
                </div>
                <h3 className="font-display font-semibold text-lg mb-2">{challenge.title}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {challenge.description || "No description"}
                </p>
                <div className="flex gap-2">
                  {isJoined ? (
                    <>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setCompletingChallenge(challenge.id)}
                        className="flex-1 border-pastel-mint/50 text-pastel-mint hover:bg-pastel-mint/10"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openChat(challenge)}
                        className="text-muted-foreground hover:text-primary"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      size="sm"
                      onClick={() => handleJoinChallenge(challenge.id)}
                      className="w-full bg-gradient-to-r from-primary/80 to-secondary/80 hover:from-primary hover:to-secondary"
                    >
                      Join Challenge
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {filteredChallenges.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg">No challenges found</p>
            <p className="text-sm">Create one to get started!</p>
          </div>
        )}

        {/* Complete with Photo Dialog */}
        <Dialog open={!!completingChallenge} onOpenChange={() => setCompletingChallenge(null)}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="font-display">Complete Challenge</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Upload a photo to prove completion and earn 10 points!
              </p>
              <div className="border-2 border-dashed border-border/50 rounded-xl p-8 text-center">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {photoFile ? (
                    <div className="space-y-2">
                      <img
                        src={URL.createObjectURL(photoFile)}
                        alt="Preview"
                        className="w-32 h-32 object-cover rounded-lg mx-auto"
                      />
                      <p className="text-sm text-muted-foreground">{photoFile.name}</p>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Click to upload photo</p>
                    </>
                  )}
                </label>
              </div>
              <Button
                onClick={handleCompleteWithPhoto}
                disabled={!photoFile}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                Complete & Earn Points
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Chat Dialog */}
        <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
          <DialogContent className="bg-card border-border max-w-lg">
            <DialogHeader>
              <DialogTitle className="font-display flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-primary" />
                {selectedChallenge?.title}
              </DialogTitle>
            </DialogHeader>
            <div className="h-64 overflow-y-auto space-y-3 mb-4">
              {chatMessages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start the conversation!
                </p>
              ) : (
                chatMessages.map((msg) => (
                  <div key={msg.id} className="p-3 bg-muted/30 rounded-lg">
                    <p className="text-xs text-primary mb-1">{msg.profiles?.username || "User"}</p>
                    <p className="text-sm">{msg.message}</p>
                  </div>
                ))
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                className="bg-muted/50"
              />
              <Button onClick={sendMessage} className="bg-primary">
                Send
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default Challenges;
