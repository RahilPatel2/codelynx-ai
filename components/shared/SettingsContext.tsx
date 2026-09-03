"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  WorkspaceSettings,
  DEFAULT_WORKSPACE_SETTINGS,
  WorkspaceSettingsSchema,
} from "@/lib/settings/types";
import { useAuth } from "@/components/shared/AuthContext";
import { useToast } from "@/components/shared/ToastProvider";

const LOCAL_STORAGE_KEY = "codelynx_settings_v1";

interface SettingsContextType {
  settings: WorkspaceSettings;
  updateSettings: (partial: Partial<WorkspaceSettings>) => Promise<boolean>;
  resetToDefaults: () => Promise<void>;
  isSaving: boolean;
  hasLoaded: boolean;
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_WORKSPACE_SETTINGS,
  updateSettings: async () => false,
  resetToDefaults: async () => {},
  isSaving: false,
  hasLoaded: false,
});

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { success, error: toastError } = useToast();
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 1. Initial hydration: read local storage immediately
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validated = WorkspaceSettingsSchema.safeParse({
          ...DEFAULT_WORKSPACE_SETTINGS,
          ...parsed,
          keyboardShortcuts: {
            ...DEFAULT_WORKSPACE_SETTINGS.keyboardShortcuts,
            ...(parsed.keyboardShortcuts || {}),
          },
        });
        if (validated.success) {
          setSettings(validated.data);
        }
      }
    } catch (e) {
      console.warn("Failed to load settings from localStorage:", e);
    } finally {
      setHasLoaded(true);
    }
  }, []);

  // 2. Fetch server settings when user authenticates
  useEffect(() => {
    let active = true;

    async function syncServerSettings() {
      if (!user) return;
      try {
        const res = await fetch("/api/settings");
        if (res.ok && active) {
          const data = await res.json();
          if (data.settings) {
            setSettings((prev) => {
              const merged = {
                ...prev,
                ...data.settings,
                keyboardShortcuts: {
                  ...prev.keyboardShortcuts,
                  ...(data.settings.keyboardShortcuts || {}),
                },
              };
              try {
                localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
              } catch (e) {}
              return merged;
            });
          }
        }
      } catch (err) {
        console.warn("Failed to sync server settings:", err);
      }
    }

    if (user) {
      syncServerSettings();
    }

    return () => {
      active = false;
    };
  }, [user]);

  // Update settings handler
  const updateSettings = useCallback(
    async (partial: Partial<WorkspaceSettings>): Promise<boolean> => {
      setIsSaving(true);
      try {
        const nextSettings: WorkspaceSettings = {
          ...settings,
          ...partial,
          keyboardShortcuts: {
            ...settings.keyboardShortcuts,
            ...(partial.keyboardShortcuts || {}),
          },
        };

        const validated = WorkspaceSettingsSchema.safeParse(nextSettings);
        if (!validated.success) {
          console.error("Invalid settings:", validated.error);
          setIsSaving(false);
          return false;
        }

        const valid = validated.data;
        setSettings(valid);

        // Save immediately to local storage
        try {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(valid));
        } catch (e) {
          console.warn("Could not save to localStorage:", e);
        }

        // Persist to server if logged in
        if (user) {
          if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
          }

          debounceTimerRef.current = setTimeout(async () => {
            try {
              const res = await fetch("/api/settings", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(partial),
              });
              if (!res.ok) {
                console.warn("Failed to persist settings to server");
              }
            } catch (err) {
              console.warn("Error updating settings on server:", err);
            } finally {
              setIsSaving(false);
            }
          }, 300);
        } else {
          setIsSaving(false);
        }

        return true;
      } catch (err: any) {
        setIsSaving(false);
        return false;
      }
    },
    [settings, user]
  );

  const resetToDefaults = useCallback(async () => {
    setIsSaving(true);
    setSettings(DEFAULT_WORKSPACE_SETTINGS);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_WORKSPACE_SETTINGS));
      if (user) {
        await fetch("/api/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(DEFAULT_WORKSPACE_SETTINGS),
        });
      }
      success("Settings reset", "Default workspace preferences restored.");
    } catch (e) {
      console.warn("Failed to reset settings:", e);
    } finally {
      setIsSaving(false);
    }
  }, [user, success]);

  return (
    <SettingsContext.Provider
      value={{
        settings,
        updateSettings,
        resetToDefaults,
        isSaving,
        hasLoaded,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => useContext(SettingsContext);
