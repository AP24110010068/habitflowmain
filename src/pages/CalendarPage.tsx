import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Calendar } from "@/components/ui/calendar";
import { Medal, CalendarDays } from "lucide-react";
import { format, isSameDay, parseISO } from "date-fns";

const CalendarPage = () => {
  const [completedDates, setCompletedDates] = useState<Date[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [completionsForDate, setCompletionsForDate] = useState<any[]>([]);

  useEffect(() => {
    fetchCompletions();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchCompletionsForDate(selectedDate);
    }
  }, [selectedDate]);

  const fetchCompletions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from("completions")
      .select("completed_at")
      .eq("user_id", user.id);

    if (data) {
      const dates = data.map(c => parseISO(c.completed_at));
      setCompletedDates(dates);
    }
  };

  const fetchCompletionsForDate = async (date: Date) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dateStr = format(date, "yyyy-MM-dd");
    const { data } = await supabase
      .from("completions")
      .select("*, challenges(title)")
      .eq("user_id", user.id)
      .eq("completed_at", dateStr);

    setCompletionsForDate(data || []);
  };

  const isCompleted = (date: Date) => {
    return completedDates.some(d => isSameDay(d, date));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <CalendarDays className="w-8 h-8 text-primary" />
            Calendar
          </h1>
          <p className="text-muted-foreground">Track your daily completions</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar */}
          <div className="glass-card p-6 animate-fade-in">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              className="w-full pointer-events-auto"
              modifiers={{
                completed: (date) => isCompleted(date),
              }}
              modifiersClassNames={{
                completed: "bg-pastel-mint/20 text-pastel-mint font-bold relative",
              }}
              components={{
                DayContent: ({ date }) => {
                  const completed = isCompleted(date);
                  return (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <span>{date.getDate()}</span>
                      {completed && (
                        <Medal className="absolute -top-1 -right-1 w-3 h-3 text-pastel-yellow" />
                      )}
                    </div>
                  );
                },
              }}
            />
          </div>

          {/* Day Details */}
          <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <h2 className="text-lg font-display font-semibold mb-4">
              {selectedDate ? format(selectedDate, "MMMM d, yyyy") : "Select a date"}
            </h2>

            {completionsForDate.length > 0 ? (
              <div className="space-y-3">
                {completionsForDate.map((completion) => (
                  <div
                    key={completion.id}
                    className="p-4 rounded-xl bg-pastel-mint/10 border border-pastel-mint/30"
                  >
                    <div className="flex items-center gap-3">
                      <Medal className="w-6 h-6 text-pastel-yellow" />
                      <div>
                        <p className="font-medium">{completion.challenges?.title}</p>
                        <p className="text-sm text-pastel-mint">
                          +{completion.points_earned} points earned
                        </p>
                      </div>
                    </div>
                    {completion.photo_url && (
                      <img
                        src={completion.photo_url}
                        alt="Completion proof"
                        className="mt-3 w-full h-32 object-cover rounded-lg"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarDays className="w-12 h-12 mx-auto mb-2 opacity-30" />
                <p>No completions on this day</p>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-pastel-mint/20 flex items-center justify-center">
              <Medal className="w-2 h-2 text-pastel-yellow" />
            </div>
            <span>Completed day</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CalendarPage;
