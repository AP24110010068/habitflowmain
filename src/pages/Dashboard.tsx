import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Trophy, Target, Flame, Coins, TrendingUp } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface Stats {
  totalChallenges: number;
  completedToday: number;
  streak: number;
  points: number;
}

const Dashboard = () => {
  const [stats, setStats] = useState<Stats>({
    totalChallenges: 0,
    completedToday: 0,
    streak: 0,
    points: 0,
  });
  const [challenges, setChallenges] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch user's joined challenges
    const { data: memberData } = await supabase
      .from("challenge_members")
      .select("challenge_id, challenges(*)")
      .eq("user_id", user.id);

    // Fetch today's completions
    const today = new Date().toISOString().split("T")[0];
    const { data: completionData } = await supabase
      .from("completions")
      .select("*")
      .eq("user_id", user.id)
      .eq("completed_at", today);

    // Fetch profile for points
    const { data: profile } = await supabase
      .from("profiles")
      .select("points")
      .eq("user_id", user.id)
      .maybeSingle();

    const joinedChallenges = memberData?.map(m => m.challenges) || [];
    setChallenges(joinedChallenges);
    setCompletions(completionData || []);

    setStats({
      totalChallenges: joinedChallenges.length,
      completedToday: completionData?.length || 0,
      streak: 7, // Simplified for now
      points: profile?.points || 0,
    });
  };

  const pieData = [
    { name: "Completed", value: stats.completedToday, color: "hsl(var(--pastel-mint))" },
    { name: "Remaining", value: Math.max(0, stats.totalChallenges - stats.completedToday), color: "hsl(var(--muted))" },
  ];

  const statCards = [
    { title: "Active Challenges", value: stats.totalChallenges, icon: Trophy, color: "from-pastel-pink to-pastel-lavender" },
    { title: "Completed Today", value: stats.completedToday, icon: Target, color: "from-pastel-mint to-pastel-sky" },
    { title: "Current Streak", value: `${stats.streak} days`, icon: Flame, color: "from-pastel-peach to-pastel-yellow" },
    { title: "Total Points", value: stats.points, icon: Coins, color: "from-pastel-lavender to-pastel-pink" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-display font-bold mb-2">
            Welcome back! <span className="wave">👋</span>
          </h1>
          <p className="text-muted-foreground">
            Here's your progress overview for today
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <div
              key={stat.title}
              className="glass-card p-5 hover-glow animate-scale-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-2xl font-display font-bold">{stat.value}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-primary-foreground" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Progress Pie Chart */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Today's Progress
            </h2>
            <div className="h-64 flex items-center justify-center">
              {stats.totalChallenges > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Join challenges to see your progress!</p>
                </div>
              )}
            </div>
            {stats.totalChallenges > 0 && (
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-pastel-mint" />
                  <span className="text-sm text-muted-foreground">Completed</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-muted" />
                  <span className="text-sm text-muted-foreground">Remaining</span>
                </div>
              </div>
            )}
          </div>

          {/* Recent Challenges */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" />
              Your Challenges
            </h2>
            <div className="space-y-3">
              {challenges.length > 0 ? (
                challenges.slice(0, 5).map((challenge: any) => {
                  const isCompleted = completions.some(c => c.challenge_id === challenge.id);
                  return (
                    <div
                      key={challenge.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isCompleted
                          ? "bg-pastel-mint/10 border-pastel-mint/30"
                          : "bg-muted/30 border-border/50 hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{challenge.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {challenge.member_count} members
                          </p>
                        </div>
                        {isCompleted && (
                          <span className="text-pastel-mint text-sm font-medium">✓ Done</span>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No challenges yet</p>
                  <p className="text-sm">Go to Challenges to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
