import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Heart, Trophy, Users, Check, Camera } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface JoinedChallenge {
  id: string;
  challenge_id: string;
  challenges: {
    id: string;
    title: string;
    description: string;
    member_count: number;
  };
}

const MyHabits = () => {
  const [joinedChallenges, setJoinedChallenges] = useState<JoinedChallenge[]>([]);
  const [todayCompletions, setTodayCompletions] = useState<string[]>([]);
  const [completingChallenge, setCompletingChallenge] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: members } = await supabase
      .from("challenge_members")
      .select("id, challenge_id, challenges(*)")
      .eq("user_id", user.id);

    setJoinedChallenges(members as JoinedChallenge[] || []);

    // Fetch today's completions
    const today = new Date().toISOString().split("T")[0];
    const { data: completions } = await supabase
      .from("completions")
      .select("challenge_id")
      .eq("user_id", user.id)
      .eq("completed_at", today);

    setTodayCompletions(completions?.map(c => c.challenge_id) || []);
  };

  const handleLeave = async (challengeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("challenge_members")
      .delete()
      .eq("challenge_id", challengeId)
      .eq("user_id", user.id);

    toast({ title: "Left challenge", description: "You've left the challenge" });
    fetchData();
  };

  const handleComplete = async () => {
    if (!completingChallenge || !photoFile) {
      toast({ title: "Error", description: "Please select a photo", variant: "destructive" });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

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
      fetchData();
    };
    reader.readAsDataURL(photoFile);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Heart className="w-8 h-8 text-primary" />
            My Habits
          </h1>
          <p className="text-muted-foreground">Challenges you've joined</p>
        </div>

        {/* Challenges List */}
        {joinedChallenges.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {joinedChallenges.map((item, index) => {
              const isCompleted = todayCompletions.includes(item.challenge_id);
              return (
                <div
                  key={item.id}
                  className={`glass-card p-5 animate-fade-in ${isCompleted ? "border-pastel-mint/30" : ""}`}
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-primary" />
                    </div>
                    {isCompleted && (
                      <span className="flex items-center gap-1 text-sm text-pastel-mint">
                        <Check className="w-4 h-4" />
                        Done today
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-semibold text-lg mb-2">
                    {item.challenges.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {item.challenges.description || "No description"}
                  </p>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
                    <Users className="w-4 h-4" />
                    <span>{item.challenges.member_count} members</span>
                  </div>
                  <div className="flex gap-2">
                    {!isCompleted && (
                      <Button
                        size="sm"
                        onClick={() => setCompletingChallenge(item.challenge_id)}
                        className="flex-1 bg-gradient-to-r from-pastel-mint/80 to-pastel-sky/80 text-background hover:from-pastel-mint hover:to-pastel-sky"
                      >
                        <Camera className="w-4 h-4 mr-1" />
                        Complete
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLeave(item.challenge_id)}
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                    >
                      Leave
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 text-center animate-fade-in">
            <Heart className="w-16 h-16 mx-auto mb-4 text-muted-foreground/30" />
            <h3 className="text-xl font-display font-semibold mb-2">No habits yet</h3>
            <p className="text-muted-foreground mb-4">
              Join challenges from the Challenges page to start tracking your habits!
            </p>
            <Button
              onClick={() => window.location.href = "/dashboard/challenges"}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Browse Challenges
            </Button>
          </div>
        )}

        {/* Complete Dialog */}
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
                  id="habit-photo-upload"
                />
                <label htmlFor="habit-photo-upload" className="cursor-pointer">
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
                      <Camera className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                      <p className="text-muted-foreground">Click to upload photo</p>
                    </>
                  )}
                </label>
              </div>
              <Button
                onClick={handleComplete}
                disabled={!photoFile}
                className="w-full bg-gradient-to-r from-primary to-secondary"
              >
                Complete & Earn Points
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default MyHabits;
