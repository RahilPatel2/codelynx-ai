"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FolderPlus,
  Plus,
  Search,
  Code2,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Clock,
  Layers,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useToast } from "@/components/shared/ToastProvider";
import { SUPPORTED_LANGUAGES } from "@/lib/languages/definitions";
import { AppHeader } from "@/components/shared/AppHeader";

export default function ProjectsPage() {
  const { success, error, info } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newProjName, setNewProjName] = useState("");
  const [newProjLang, setNewProjLang] = useState("python");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const res = await fetch("/api/projects");
      if (res.ok) {
        const data = await res.json();
        setProjects(data.projects || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim(),
          language: newProjLang,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjects((prev) => [data.project, ...prev]);
        setIsCreating(false);
        setNewProjName("");
        setNewProjDesc("");
        success("Project created", data.project.name);
      }
    } catch (err) {
      error("Creation failed", "Could not create project");
    }
  };

  const handleDeleteProject = async (id: string, name: string) => {
    if (confirm(`Delete project "${name}"? This action cannot be undone.`)) {
      await fetch(`/api/projects/${id}`, { method: "DELETE" });
      setProjects((prev) => prev.filter((p) => p.id !== id));
      success("Project deleted", name);
    }
  };

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-screen bg-[#0a0b0e] text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <AppHeader
        title="Project Workspaces"
        icon={<FolderPlus className="w-4 h-4 text-cyan-400" />}
        showBack={true}
        showDashboard={true}
      >
        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-lg shadow-indigo-950 transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Project</span>
        </button>
      </AppHeader>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 max-w-7xl w-full mx-auto">
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search workspaces by name or description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-cyan-500/50"
            />
          </div>

          <span className="text-xs text-slate-400">
            {filteredProjects.length} total projects
          </span>
        </div>

        {/* Modal: Create New Project */}
        {isCreating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <form
              onSubmit={handleCreateProject}
              className="w-full max-w-md rounded-2xl bg-[#11131c] border border-slate-700 shadow-2xl p-6 space-y-4"
            >
              <h3 className="font-bold text-base text-white">Create New Project</h3>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-medium">Project Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Distributed Consensus Engine"
                  value={newProjName}
                  onChange={(e) => setNewProjName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-medium">Programming Language</label>
                <select
                  value={newProjLang}
                  onChange={(e) => setNewProjLang(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-cyan-500"
                >
                  {SUPPORTED_LANGUAGES.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="text-slate-300 font-medium">Description (Optional)</label>
                <textarea
                  placeholder="Explain the purpose of this project or algorithm..."
                  value={newProjDesc}
                  onChange={(e) => setNewProjDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white outline-none focus:border-cyan-500 h-20 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white"
                >
                  Create Project
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Project Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((p) => (
            <div
              key={p.id}
              className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between group space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-slate-700 uppercase">
                    {p.language}
                  </span>
                  <button
                    onClick={() => handleDeleteProject(p.id, p.name)}
                    title="Delete Project"
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400 transition-opacity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition-colors">
                  {p.name}
                </h3>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.description || "No description provided."}
                </p>
              </div>

              <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </span>

                <Link
                  href="/workspace"
                  className="flex items-center gap-1.5 font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                >
                  <span>Open in Workspace</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
