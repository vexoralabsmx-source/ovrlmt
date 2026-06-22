"use client";

import dynamic from "next/dynamic";
import { Component, type ErrorInfo, type ReactNode } from "react";
const Scene = dynamic(() => import("./Scene").then(m => m.Scene), { ssr: false, loading: () => <div className="scene scene-fallback" /> });

class SceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.warn("WebGL scene disabled", error, info); }
  render() { return this.state.failed ? <div className="scene scene-fallback" /> : this.props.children; }
}

export function HeroScene() { return <SceneBoundary><Scene /></SceneBoundary>; }
