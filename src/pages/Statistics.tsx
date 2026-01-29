import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { BarChart3, TrendingUp, Calendar, Target } from "lucide-react";
import { format, subDays, parseISO } from "date-fns";

const Statistics = () => {
  const [weeklyData, setWeeklyData] = useState<{ day: string; completions: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [totalStats, setTotalStats] = useState({ total: 0, thisWeek: 0, average: 0 });

  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch completions for the last 7 days
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), 6 - i);
      return format(date, "yyyy-MM-dd");
    });

    const { data: completions } = await supabase
      .from("completions")
      .select("completed_at, challenges(category)")
      .eq("user_id", user.id)
      .gte("completed_at", last7Days[0])
      .lte("completed_at", last7Days[6]);

    // Process weekly data
    const weekly = last7Days.map(date => {
      const count = completions?.filter(c => c.completed_at === date).length || 0;
      return {
        day: format(parseISO(date), "EEE"),
        completions: count,
      };
    });
    setWeeklyData(weekly);

    // Process category data
    const categories: { [key: string]: number } = {};
    completions?.forEach(c => {
      const cat = c.challenges?.category || "general";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    const colors = ["hsl(var(--pastel-pink))", "hsl(var(--pastel-mint))", "hsl(var(--pastel-lavender))", "hsl(var(--pastel-sky))"];
    const catData = Object.entries(categories).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    }));
    setCategoryData(catData);

    // Total stats
    const { data: allCompletions } = await supabase
      .from("completions")
      .select("id")
      .eq("user_id", user.id);

    const thisWeekCount = completions?.length || 0;
    const totalCount = allCompletions?.length || 0;

    setTotalStats({
      total: totalCount,
      thisWeek: thisWeekCount,
      average: thisWeekCount > 0 ? Math.round(thisWeekCount / 7 * 10) / 10 : 0,
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-primary" />
            Statistics
          </h1>
          <p className="text-muted-foreground">Track your consistency and progress</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card p-5 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pastel-pink/30 to-pastel-lavender/30 flex items-center justify-center">
                <Target className="w-5 h-5 text-pastel-pink" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Completions</p>
                <p className="text-2xl font-display font-bold">{totalStats.total}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pastel-mint/30 to-pastel-sky/30 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-pastel-mint" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">This Week</p>
                <p className="text-2xl font-display font-bold">{totalStats.thisWeek}</p>
              </div>
            </div>
          </div>

          <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pastel-yellow/30 to-pastel-peach/30 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-pastel-yellow" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Average</p>
                <p className="text-2xl font-display font-bold">{totalStats.average}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Daily Consistency Bar Chart */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Daily Consistency (Last 7 Days)
            </h2>
            <div className="h-64">
              {weeklyData.some(d => d.completions > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="completions" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>Complete challenges to see your stats!</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Distribution */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Category Distribution
            </h2>
            <div className="h-64">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
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
                <div className="h-full flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <TrendingUp className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p>No category data yet</p>
                  </div>
                </div>
              )}
            </div>
            {categoryData.length > 0 && (
              <div className="flex flex-wrap justify-center gap-4 mt-4">
                {categoryData.map((cat) => (
                  <div key={cat.name} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm text-muted-foreground capitalize">{cat.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Statistics;
