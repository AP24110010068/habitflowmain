import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, User, Palette, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const themes = [
  { id: "dark", name: "Dark", color: "bg-[#1a1a2e]" },
  { id: "midnight", name: "Midnight", color: "bg-[#0d1117]" },
  { id: "forest", name: "Forest", color: "bg-[#1a2f23]" },
  { id: "ocean", name: "Ocean", color: "bg-[#0f1729]" },
];

const backgrounds = [
  { id: "default", name: "Default" },
  { id: "gradient", name: "Gradient" },
  { id: "minimal", name: "Minimal" },
];

const SettingsPage = () => {
  const [profile, setProfile] = useState({ username: "", avatar_url: "" });
  const [settings, setSettings] = useState({ theme: "dark", background: "default" });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("username, avatar_url")
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: settingsData } = await supabase
      .from("user_settings")
      .select("theme, background")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profileData) {
      setProfile(profileData);
    }
    if (settingsData) {
      setSettings(settingsData);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({ username: profile.username, avatar_url: profile.avatar_url })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved! ✨", description: "Profile updated successfully" });
    }
    setIsLoading(false);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("user_settings")
      .update({ theme: settings.theme, background: settings.background })
      .eq("user_id", user.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Saved! ✨", description: "Settings updated successfully" });
    }
    setIsLoading(false);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-2xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold flex items-center gap-3">
            <Settings className="w-8 h-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Customize your profile and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="glass-card p-6 animate-fade-in">
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-primary" />
            Profile
          </h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={profile.username || ""}
                onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                className="bg-muted/50"
                placeholder="Your username"
              />
            </div>
            <div>
              <Label htmlFor="avatar">Avatar URL</Label>
              <Input
                id="avatar"
                value={profile.avatar_url || ""}
                onChange={(e) => setProfile({ ...profile, avatar_url: e.target.value })}
                className="bg-muted/50"
                placeholder="https://example.com/avatar.jpg"
              />
            </div>
            {profile.avatar_url && (
              <div className="flex items-center gap-4">
                <img
                  src={profile.avatar_url}
                  alt="Avatar preview"
                  className="w-16 h-16 rounded-full object-cover border-2 border-primary/30"
                />
                <span className="text-sm text-muted-foreground">Avatar preview</span>
              </div>
            )}
            <Button
              onClick={handleSaveProfile}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Profile
            </Button>
          </div>
        </div>

        {/* Theme Section */}
        <div className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
          <h2 className="text-lg font-display font-semibold mb-4 flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Theme
          </h2>
          <div className="space-y-4">
            <div>
              <Label className="mb-3 block">Color Theme</Label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {themes.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => setSettings({ ...settings, theme: theme.id })}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      settings.theme === theme.id
                        ? "border-primary"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    <div className={`w-full h-8 rounded-lg ${theme.color} mb-2`} />
                    <span className="text-sm">{theme.name}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label className="mb-3 block">Background Style</Label>
              <div className="grid grid-cols-3 gap-3">
                {backgrounds.map((bg) => (
                  <button
                    key={bg.id}
                    onClick={() => setSettings({ ...settings, background: bg.id })}
                    className={`p-4 rounded-xl border-2 transition-all text-sm ${
                      settings.background === bg.id
                        ? "border-primary bg-primary/10"
                        : "border-border/50 hover:border-border"
                    }`}
                  >
                    {bg.name}
                  </button>
                ))}
              </div>
            </div>
            <Button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SettingsPage;
