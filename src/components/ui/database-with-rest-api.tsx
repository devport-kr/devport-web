"use client";

import { motion } from "framer-motion";
import { BookOpen, BotMessageSquare, SparklesIcon, TrendingUp, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

interface DatabaseWithRestApiProps {
  className?: string;
  circleText?: string;
  badgeTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  buttonTexts?: {
    first: string;
    second: string;
    third: string;
    fourth: string;
  };
  title?: string;
  lightColor?: string;
}

const DatabaseWithRestApi = ({
  className,
  circleText,
  badgeTexts,
  title,
  lightColor,
}: DatabaseWithRestApiProps) => {
  return (
    <div
      className={cn(
        "relative flex h-[500px] w-full max-w-[650px] flex-col items-center",
        className
      )}
    >
      {/* SVG Paths  */}
      <svg
        className="h-full sm:w-full text-surface-border"
        width="100%"
        height="100%"
        viewBox="0 0 200 100"
      >
        <g
          stroke="currentColor"
          fill="none"
          strokeWidth="0.4"
          strokeDasharray="100 100"
          pathLength="100"
        >
          <path d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10" />
          <path d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10" />
          <path d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10" />
          <path d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10" />
          {/* Animation For Path Starting */}
          <animate
            attributeName="stroke-dashoffset"
            from="100"
            to="0"
            dur="1s"
            fill="freeze"
            calcMode="spline"
            keySplines="0.25,0.1,0.5,1"
            keyTimes="0; 1"
          />
        </g>
        {/* Blue Lights */}
        <g mask="url(#db-mask-1)">
          <circle
            className="database db-light-1"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-2)">
          <circle
            className="database db-light-2"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-3)">
          <circle
            className="database db-light-3"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        <g mask="url(#db-mask-4)">
          <circle
            className="database db-light-4"
            cx="0"
            cy="0"
            r="12"
            fill="url(#db-blue-grad)"
          />
        </g>
        {/* Buttons */}
        <g stroke="currentColor" fill="none" strokeWidth="0.4">
          {/* First Button - Codes */}
          <g>
            <rect fill="#18181B" x="14" y="5" width="34" height="10" rx="5"></rect>
            <CodeIcon x="18" y="7.5"></CodeIcon>
            <text x="28" y="12" fill="white" stroke="none" fontSize="5" fontWeight="500">
              {badgeTexts?.first || "Codes"}
            </text>
          </g>
          {/* Second Button - Docs */}
          <g>
            <rect fill="#18181B" x="60" y="5" width="34" height="10" rx="5"></rect>
            <DocIcon x="64" y="7.5"></DocIcon>
            <text x="74" y="12" fill="white" stroke="none" fontSize="5" fontWeight="500">
              {badgeTexts?.second || "Docs"}
            </text>
          </g>
          {/* Third Button - Issues */}
          <g>
            <rect fill="#18181B" x="108" y="5" width="34" height="10" rx="5"></rect>
            <IssueIcon x="112" y="7.5"></IssueIcon>
            <text x="122" y="12" fill="white" stroke="none" fontSize="5" fontWeight="500">
              {badgeTexts?.third || "Issues"}
            </text>
          </g>
          {/* Fourth Button - Releases */}
          <g>
            <rect fill="#18181B" x="150" y="5" width="40" height="10" rx="5"></rect>
            <ReleaseIcon x="154" y="7.5"></ReleaseIcon>
            <text x="165" y="12" fill="white" stroke="none" fontSize="5" fontWeight="500">
              {badgeTexts?.fourth || "Releases"}
            </text>
          </g>
        </g>
        <defs>
          {/* 1 -  user list */}
          <mask id="db-mask-1">
            <path
              d="M 31 10 v 15 q 0 5 5 5 h 59 q 5 0 5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 2 - task list */}
          <mask id="db-mask-2">
            <path
              d="M 77 10 v 10 q 0 5 5 5 h 13 q 5 0 5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 3 - backlogs */}
          <mask id="db-mask-3">
            <path
              d="M 124 10 v 10 q 0 5 -5 5 h -14 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* 4 - misc */}
          <mask id="db-mask-4">
            <path
              d="M 170 10 v 15 q 0 5 -5 5 h -60 q -5 0 -5 5 v 10"
              strokeWidth="0.5"
              stroke="white"
            />
          </mask>
          {/* Blue Grad */}
          <radialGradient id="db-blue-grad" fx="1">
            <stop offset="0%" stopColor={lightColor || "#00A6F5"} />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>
      </svg>
      {/* Main Box */}
      <div className="absolute bottom-14 flex w-full flex-col items-center">
        {/* box title */}
        <div className="absolute -top-3 z-20 flex items-center justify-center rounded-lg border border-surface-border bg-[#101112] px-2 py-1 sm:-top-4 sm:py-1.5">
          <SparklesIcon className="size-4 text-text-secondary" />
          <span className="ml-2 text-sm text-text-secondary">
            {title ? title : "Data exchange using a customized REST API"}
          </span>
        </div>
        {/* box outter circle */}
        <div className="absolute -bottom-8 z-30 grid h-[60px] w-[60px] place-items-center rounded-full border border-surface-border bg-[#141516] font-semibold text-xs text-text-primary">
          {circleText ? circleText : "SVG"}
        </div>
        {/* box content */}
        <div className="relative z-10 flex h-[200px] w-full items-center justify-center overflow-hidden rounded-lg border border-surface-border bg-transparent">
          {/* Badges */}
          <div className="absolute bottom-8 left-10 z-10 h-8 rounded-full bg-[#101112] px-4 text-sm border border-surface-border text-text-secondary flex items-center gap-2">
            <BotMessageSquare className="size-4" />
            <span>AI</span>
          </div>
          <div className="absolute top-8 right-10 z-10 h-8 rounded-full bg-[#101112] px-4 text-sm flex border border-surface-border text-text-secondary items-center gap-2">
            <BookOpen className="size-4" />
            <span>분석</span>
          </div>
          <div className="absolute top-8 left-10 z-10 h-8 rounded-full bg-[#101112] px-4 text-sm flex border border-surface-border text-text-secondary items-center gap-2">
            <TrendingUp className="size-4" />
            <span>탐색</span>
          </div>
          <div className="absolute bottom-8 right-10 z-10 h-8 rounded-full bg-[#101112] px-4 text-sm flex border border-surface-border text-text-secondary items-center gap-2">
            <Trophy className="size-4" />
            <span>비교</span>
          </div>
          {/* Circles */}
          <motion.div
            className="absolute -bottom-16 h-[130px] w-[130px] rounded-full border-t bg-accent/5"
            animate={{
              scale: [0.98, 1.02, 0.98, 1, 1, 1, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-24 h-[185px] w-[185px] rounded-full border-t bg-accent/5"
            animate={{
              scale: [1, 1, 1, 0.98, 1.02, 0.98, 1, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[120px] h-[245px] w-[245px] rounded-full border-t bg-accent/5"
            animate={{
              scale: [1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.div
            className="absolute -bottom-[150px] h-[305px] w-[305px] rounded-full border-t bg-accent/5"
            animate={{
              scale: [1, 1, 1, 1, 1, 1, 0.98, 1.02, 0.98, 1],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
      </div>
    </div>
  );
};

export default DatabaseWithRestApi;

// Codes: </>
const CodeIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => (
  <svg x={x} y={y} width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

// Docs: file with lines
const DocIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => (
  <svg x={x} y={y} width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="8" y1="13" x2="16" y2="13" />
    <line x1="8" y1="17" x2="12" y2="17" />
  </svg>
);

// Issues: circle with dot
const IssueIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => (
  <svg x={x} y={y} width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="3" fill="white" stroke="none" />
  </svg>
);

// Releases: tag
const ReleaseIcon = ({ x = "0", y = "0" }: { x: string; y: string }) => (
  <svg x={x} y={y} width="5" height="5" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
    <line x1="7" y1="7" x2="7.01" y2="7" />
  </svg>
);
