"use client";

import React, { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import dynamic from "next/dynamic";
import { getLanguageById } from "@/lib/languages/definitions";
import { Loader2 } from "lucide-react";

export interface EditorMarker {
  startLineNumber: number;
  startColumn?: number;
  endLineNumber?: number;
  endColumn?: number;
  message: string;
  severity: "error" | "warning" | "info";
}

export interface CodeEditorHandle {
  revealLine: (line: number, column?: number) => void;
  focus: () => void;
  formatDocument: () => void;
  getValue: () => string;
  applyEdits: (newText: string) => boolean;
}

interface CodeEditorProps {
  value: string;
  language: string;
  onChange: (val: string) => void;
  markers?: EditorMarker[];
  activeLine?: number | null;
  fontSize?: number;
  fontFamily?: string;
  theme?: string;
  minimap?: boolean;
  wordWrap?: boolean;
  lineNumbers?: boolean;
  readOnly?: boolean;
}

// Dynamically import Monaco Editor to prevent SSR hydration issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-[#0e1017] text-slate-400">
      <Loader2 className="w-6 h-6 animate-spin mr-2 text-indigo-400" />
      <span className="text-sm font-mono">Initializing CodeLynx Monaco Editor...</span>
    </div>
  ),
});

export const CodeEditor = forwardRef<CodeEditorHandle, CodeEditorProps>(
  (
    {
      value,
      language,
      onChange,
      markers = [],
      activeLine,
      fontSize = 14,
      fontFamily = "JetBrains Mono",
      theme = "codelynx-dark",
      minimap = true,
      wordWrap = true,
      lineNumbers = true,
      readOnly = false,
    },
    ref
  ) => {
    const editorRef = useRef<any>(null);
    const monacoRef = useRef<any>(null);
    const langDef = getLanguageById(language);

    // Expose navigation and editing methods imperatively
    useImperativeHandle(ref, () => ({
      revealLine: (line: number, column: number = 1) => {
        if (editorRef.current) {
          editorRef.current.revealLineInCenter(line);
          editorRef.current.setPosition({ lineNumber: line, column });
          editorRef.current.focus();
        }
      },
      focus: () => {
        editorRef.current?.focus();
      },
      formatDocument: () => {
        editorRef.current?.getAction("editor.action.formatDocument")?.run();
      },
      getValue: () => {
        return editorRef.current?.getModel()?.getValue() ?? "";
      },
      applyEdits: (newText: string) => {
        if (!editorRef.current) return false;
        const model = editorRef.current.getModel();
        if (!model) return false;
        const fullRange = model.getFullModelRange();
        editorRef.current.executeEdits("codelynx-optimizer", [
          {
            range: fullRange,
            text: newText,
            forceMoveMarkers: true,
          },
        ]);
        editorRef.current.pushUndoStop();
        return model.getValue() === newText;
      },
    }));

    const registerThemes = (monaco: any) => {
      // 1. Sleek CodeLynx dark theme
      monaco.editor.defineTheme("codelynx-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "64748B", fontStyle: "italic" },
          { token: "keyword", foreground: "A855F7", fontStyle: "bold" },
          { token: "string", foreground: "34D399" },
          { token: "number", foreground: "F59E0B" },
          { token: "type", foreground: "38BDF8" },
          { token: "function", foreground: "60A5FA" },
        ],
        colors: {
          "editor.background": "#0b0d13",
          "editor.foreground": "#E2E8F0",
          "editorLineNumber.foreground": "#475569",
          "editorLineNumber.activeForeground": "#38BDF8",
          "editor.selectionBackground": "#312E81",
          "editor.lineHighlightBackground": "#131722",
          "editorCursor.foreground": "#00E5FF",
          "editorWhitespace.foreground": "#1E293B",
        },
      });

      // 2. Monokai theme
      monaco.editor.defineTheme("monokai", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "75715E", fontStyle: "italic" },
          { token: "keyword", foreground: "F92672", fontStyle: "bold" },
          { token: "string", foreground: "E6DB74" },
          { token: "number", foreground: "AE81FF" },
          { token: "type", foreground: "66D9EF", fontStyle: "italic" },
          { token: "function", foreground: "A6E22E" },
        ],
        colors: {
          "editor.background": "#272822",
          "editor.foreground": "#F8F8F2",
          "editorLineNumber.foreground": "#90908A",
          "editorLineNumber.activeForeground": "#F8F8F2",
          "editor.selectionBackground": "#49483E",
          "editor.lineHighlightBackground": "#3E3D32",
          "editorCursor.foreground": "#F8F8F0",
        },
      });

      // 3. Nord theme
      monaco.editor.defineTheme("nord", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "4C566A", fontStyle: "italic" },
          { token: "keyword", foreground: "81A1C1", fontStyle: "bold" },
          { token: "string", foreground: "A3BE8C" },
          { token: "number", foreground: "B48EAD" },
          { token: "type", foreground: "8FBCBB" },
          { token: "function", foreground: "88C0D0" },
        ],
        colors: {
          "editor.background": "#2E3440",
          "editor.foreground": "#D8DEE9",
          "editorLineNumber.foreground": "#4C566A",
          "editorLineNumber.activeForeground": "#88C0D0",
          "editor.selectionBackground": "#434C5E",
          "editor.lineHighlightBackground": "#3B4252",
          "editorCursor.foreground": "#ECEFF4",
        },
      });

      // 4. GitHub Dark theme
      monaco.editor.defineTheme("github-dark", {
        base: "vs-dark",
        inherit: true,
        rules: [
          { token: "comment", foreground: "8B949E", fontStyle: "italic" },
          { token: "keyword", foreground: "FF7B72", fontStyle: "bold" },
          { token: "string", foreground: "A5D6FF" },
          { token: "number", foreground: "79C0FF" },
          { token: "type", foreground: "FFA657" },
          { token: "function", foreground: "D2A8FF" },
        ],
        colors: {
          "editor.background": "#0D1117",
          "editor.foreground": "#C9D1D9",
          "editorLineNumber.foreground": "#6E7681",
          "editorLineNumber.activeForeground": "#58A6FF",
          "editor.selectionBackground": "#163356",
          "editor.lineHighlightBackground": "#161B22",
          "editorCursor.foreground": "#58A6FF",
        },
      });
    };

    const handleEditorDidMount = (editor: any, monaco: any) => {
      editorRef.current = editor;
      monacoRef.current = monaco;

      registerThemes(monaco);
      monaco.editor.setTheme(theme);
      updateMarkers(editor, monaco, markers);
    };

    // Helper to apply Monaco model markers (red squiggles for errors, yellow for warnings)
    const updateMarkers = (editor: any, monaco: any, markerList: EditorMarker[]) => {
      if (!editor || !monaco) return;
      const model = editor.getModel();
      if (!model) return;

      const formattedMarkers = markerList.map((m) => {
        const line = Math.max(1, Math.min(m.startLineNumber, model.getLineCount()));
        const maxCol = model.getLineMaxColumn(line);

        let severity = monaco.MarkerSeverity.Info;
        if (m.severity === "error") {
          severity = monaco.MarkerSeverity.Error;
        } else if (m.severity === "warning") {
          severity = monaco.MarkerSeverity.Warning;
        }

        return {
          startLineNumber: line,
          startColumn: m.startColumn || 1,
          endLineNumber: m.endLineNumber ? Math.min(m.endLineNumber, model.getLineCount()) : line,
          endColumn: m.endColumn || maxCol,
          message: m.message,
          severity,
        };
      });

      monaco.editor.setModelMarkers(model, "codelynx-diagnostics", formattedMarkers);
    };

    // Keep markers synchronized whenever markers or value change
    useEffect(() => {
      if (editorRef.current && monacoRef.current) {
        updateMarkers(editorRef.current, monacoRef.current, markers);
      }
    }, [markers, value]);

    // Navigate to active line if provided
    useEffect(() => {
      if (activeLine && editorRef.current) {
        editorRef.current.revealLineInCenter(activeLine);
        editorRef.current.setPosition({ lineNumber: activeLine, column: 1 });
      }
    }, [activeLine]);

    // Dynamically update Monaco editor options when props change
    useEffect(() => {
      if (editorRef.current) {
        editorRef.current.updateOptions({
          fontSize,
          fontFamily: `'${fontFamily}', 'JetBrains Mono', 'Fira Code', Consolas, monospace`,
          minimap: { enabled: minimap },
          wordWrap: wordWrap ? "on" : "off",
          lineNumbers: lineNumbers ? "on" : "off",
          readOnly,
        });
      }
    }, [fontSize, fontFamily, minimap, wordWrap, lineNumbers, readOnly]);

    // Dynamically update Monaco theme when theme prop changes
    useEffect(() => {
      if (monacoRef.current && theme) {
        monacoRef.current.editor.setTheme(theme);
      }
    }, [theme]);

    const isMobileScreen = typeof window !== "undefined" && window.innerWidth < 768;
    const effectiveMinimap = isMobileScreen ? false : minimap;

    return (
      <div className="relative h-full w-full overflow-hidden bg-[#0b0d13] min-w-0 min-h-0 overscroll-contain">
        <MonacoEditor
          height="100%"
          language={langDef.monacoLanguage}
          value={value}
          onChange={(val) => onChange(val || "")}
          onMount={handleEditorDidMount}
          theme={theme}
          options={{
            fontSize,
            fontFamily: `'${fontFamily}', 'JetBrains Mono', 'Fira Code', Consolas, monospace`,
            minimap: { enabled: effectiveMinimap },
            wordWrap: wordWrap ? "on" : "off",
            automaticLayout: true,
            fontLigatures: true,
            tabSize: 4,
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: "smooth",
            cursorSmoothCaretAnimation: "on",
            padding: { top: 12, bottom: 12 },
            lineNumbers: lineNumbers ? "on" : "off",
            lineNumbersMinChars: 3,
            lineDecorationsWidth: 6,
            glyphMargin: false,
            renderLineHighlight: "all",
            bracketPairColorization: { enabled: true },
            readOnly,
          }}
        />
      </div>
    );
  }
);

CodeEditor.displayName = "CodeEditor";
