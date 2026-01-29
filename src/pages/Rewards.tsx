import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Gift, Coins, IndianRupee, Trophy, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Rewards = () => {
  const [profile, setProfile] = useState<{ points: number; total_earned: number } | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("profiles")
      .select("points, total_earned")
      .eq("user_id", user.id)
      .maybeSingle();

    setProfile(data);
  };

  const handleRedeem = async () => {
    if (!profile || profile.points < 100) {
      toast({
        title: "Not enough points",
        description: "You need at least 100 points to redeem",
        variant: "destructive",
      });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const pointsToRedeem = Math.floor(profile.points / 100) * 100;
    const rupeesToEarn = pointsToRedeem / 10; // 100 points = ₹10

    const { error } = await supabase
      .from("profiles")
      .update({
        points: profile.points - pointsToRedeem,
        total_earned: (profile.total_earned || 0) + rupeesToEarn,
      })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }

    toast({
      title: "Redeemed! 🎉",
      description: `You've earned ₹${rupeesToEarn}!`,
    });
    fetchProfile();
  };

  const redeemableRupees = profile ? Math.floor(profile.points / 100) * 10 : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Gift className="w-8 h-8 text-primary" />
            Rewards
          </h1>
          <p className="text-muted-foreground">Convert your points to real money</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card p-6 animate-fade-in">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pastel-yellow/30 to-pastel-peach/30 flex items-center justify-center">
                <Coins className="w-7 h-7 text-pastel-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Points</p>
                <p className="text-3xl font-display font-bold">{profile?.points || 0}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pastel-mint/30 to-pastel-sky/30 flex items-center justify-center">
                <IndianRupee className="w-7 h-7 text-pastel-mint" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Earned</p>
                <p className="text-3xl font-display font-bold">₹{profile?.total_earned?.toFixed(2) || "0.00"}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pastel-pink/30 to-pastel-lavender/30 flex items-center justify-center">
                <Trophy className="w-7 h-7 text-pastel-pink" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Redeemable</p>
                <p className="text-3xl font-display font-bold">₹{redeemableRupees}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Redemption Card */}
        <div className="glass-card p-8 animate-fade-in" style={{ animationDelay: "0.3s" }}>
          <div className="flex items-center gap-3 mb-6">
            <Sparkles className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-display font-semibold">Redeem Points</h2>
          </div>

          <div className="bg-muted/30 rounded-2xl p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">100 points = ₹10</span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-muted-foreground">Your Points</span>
              <span className="font-medium">{profile?.points || 0} points</span>
            </div>
            <div className="h-px bg-border my-4" />
            <div className="flex items-center justify-between">
              <span className="font-medium">You'll Receive</span>
              <span className="text-2xl font-display font-bold text-pastel-mint">₹{redeemableRupees}</span>
            </div>
          </div>

          <Button
            onClick={handleRedeem}
            disabled={(profile?.points || 0) < 100}
            className="w-full h-12 bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-lg font-medium"
          >
            {(profile?.points || 0) < 100 ? (
              `Need ${100 - (profile?.points || 0)} more points`
            ) : (
              `Redeem ₹${redeemableRupees}`
            )}
          </Button>
        </div>

        {/* How it works */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          <h3 className="font-display font-semibold mb-4">How to Earn Points</h3>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pastel-mint/20 flex items-center justify-center text-pastel-mint font-medium">
                1
              </div>
              <span>Join or create challenges</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pastel-pink/20 flex items-center justify-center text-pastel-pink font-medium">
                2
              </div>
              <span>Complete daily tasks and upload proof photos</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pastel-lavender/20 flex items-center justify-center text-pastel-lavender font-medium">
                3
              </div>
              <span>Earn 10 points per completed task with photo</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pastel-yellow/20 flex items-center justify-center text-pastel-yellow font-medium">
                4
              </div>
              <span>Redeem 100 points for ₹10</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Rewards;
