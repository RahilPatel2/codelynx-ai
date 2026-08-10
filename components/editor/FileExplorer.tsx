"use client";

import React, { useState } from "react";
import {
  FileCode,
  FilePlus,
  Trash2,
  Edit2,
  Download,
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  File,
} from "lucide-react";
import { IProjectFile } from "@/models/Project";

interface FileExplorerProps {
  files: IProjectFile[];
  activeFileId: string;
  onSelectFile: (fileId: string) => void;
  onCreateFile: (name: string) => void;
  onRenameFile: (fileId: string, newName: string) => void;
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (file: IProjectFile) => void;
}

export const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  onSelectFile,
  onCreateFile,
  onRenameFile,
  onDeleteFile,
  onDownloadFile,
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFileName, setNewFileName] = useState("");
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFileName.trim()) {
      onCreateFile(newFileName.trim());
      setNewFileName("");
      setIsCreating(false);
    }
  };

  const handleRenameSubmit = (fileId: string) => {
    if (editName.trim()) {
      onRenameFile(fileId, editName.trim());
    }
    setEditingFileId(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#0d0f17] border-r border-slate-800 text-xs select-none">
      {/* File Explorer Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#121520] border-b border-white/5">
        <span className="font-semibold text-slate-300 uppercase tracking-wider text-[11px]">
          Explorer
        </span>
        <button
          onClick={() => setIsCreating(true)}
          className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          title="New File"
        >
          <FilePlus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Files List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5">
        {files.map((file) => {
          const isActive = file.id === activeFileId;
          const isEditing = file.id === editingFileId;

          return (
            <div
              key={file.id}
              onClick={() => !isEditing && onSelectFile(file.id)}
              className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md cursor-pointer transition-colors ${
                isActive
                  ? "bg-indigo-600/20 text-white font-medium border-l-2 border-indigo-400"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <FileCode
                  className={`w-3.5 h-3.5 shrink-0 ${
                    isActive ? "text-cyan-400" : "text-slate-500 group-hover:text-slate-400"
                  }`}
                />

                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleRenameSubmit(file.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleRenameSubmit(file.id);
                      if (e.key === "Escape") setEditingFileId(null);
                    }}
                    autoFocus
                    className="bg-slate-950 border border-indigo-500 rounded px-1.5 py-0.5 text-white outline-none w-full"
                  />
                ) : (
                  <span className="truncate text-xs">{file.name}</span>
                )}
              </div>

              {!isEditing && (
                <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFileId(file.id);
                      setEditName(file.name);
                    }}
                    title="Rename"
                    className="p-1 hover:text-white"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownloadFile(file);
                    }}
                    title="Download"
                    className="p-1 hover:text-cyan-300"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  {files.length > 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete file "${file.name}"?`)) {
                          onDeleteFile(file.id);
                        }
                      }}
                      title="Delete"
                      className="p-1 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {isCreating && (
          <form onSubmit={handleCreateSubmit} className="px-2 py-1">
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              placeholder="filename.py / main.cpp"
              autoFocus
              onBlur={() => setIsCreating(false)}
              className="w-full bg-slate-950 border border-indigo-500 rounded px-2 py-1 text-xs text-white outline-none"
            />
          </form>
        )}
      </div>
    </div>
  );
};
