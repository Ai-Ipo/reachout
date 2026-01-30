import React from "react";
import { BackgroundRippleEffect } from "./ui/background-ripple-effect";
import { AnimatedThemeToggler } from "./ui/animated-theme-toggler";
import { Highlighter } from "./ui/highlighter";

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen w-[100vw]  flex items-center justify-center">
            <div className="text-4xl font-bold flex flex-col absolute left-12 top-12">
                <span>AI IPO</span>
                <Highlighter action="underline" color=""  strokeWidth={1.5} animationDuration={600} iterations={2} padding={2} multiline={true} isView={false}>
                    <span className="text-sm text-muted-foreground">IPO Reachout Platform</span>
                </Highlighter>
            </div>
            <BackgroundRippleEffect rows={12} cols={27} cellSize={56} />
            {children}
        </div>
    );
}
