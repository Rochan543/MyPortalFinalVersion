import { useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/auth";

interface ExamSecurityOptions {
  examId: number;
  attemptId: number;
  isTopicMock?: boolean;
  onFirstViolation?: (type: string) => void;
  onAutoSubmit?: () => void;
}

export function useExamSecurity({
  examId,
  attemptId,
  isTopicMock = false,
  onFirstViolation,
  onAutoSubmit,
}: ExamSecurityOptions) {
  const { token } = useAuth() as any;
  const localViolationCount = useRef(0);
  const isActive = useRef(true);
  const hasAutoSubmitted = useRef(false);
  const fullscreenRetryRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getApiBase = () => {
    const base = (import.meta.env.BASE_URL || "").replace(/\/$/, "");
    return `${base}/api`;
  };

  const recordViolation = useCallback(async (type: string) => {
    if (isTopicMock || !isActive.current || hasAutoSubmitted.current) return;

    localViolationCount.current += 1;
    const localCount = localViolationCount.current;

    try {
      const res = await fetch(`${getApiBase()}/topic-mocks/violations/record`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examId, attemptId, violationType: type }),
      });
      const data = await res.json();

      if (data.violationCount === 1) {
        onFirstViolation?.(type);
      } else if (data.autoSubmitted && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        isActive.current = false;
        onAutoSubmit?.();
      }
    } catch {
      // Fallback using local count if API fails
      if (localCount === 1) {
        onFirstViolation?.(type);
      } else if (localCount >= 2 && !hasAutoSubmitted.current) {
        hasAutoSubmitted.current = true;
        isActive.current = false;
        onAutoSubmit?.();
      }
    }
  }, [examId, attemptId, isTopicMock, token, onFirstViolation, onAutoSubmit]);

  const requestFullscreen = useCallback(() => {
    if (isTopicMock || !isActive.current) return;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  }, [isTopicMock]);

  useEffect(() => {
    if (isTopicMock) return;

    isActive.current = true;
    hasAutoSubmitted.current = false;
    localViolationCount.current = 0;

    // Enter fullscreen immediately
    setTimeout(() => requestFullscreen(), 300);

    const handleVisibilityChange = () => {
      if (document.hidden && isActive.current) {
        recordViolation("tab_switch");
      }
    };

    const handleBlur = () => {
      if (isActive.current) {
        recordViolation("window_blur");
      }
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (isActive.current && e.clientY <= 0) {
        // Only fire when mouse leaves to top (address bar area)
        recordViolation("mouse_leave");
      }
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isActive.current && !hasAutoSubmitted.current) {
        // Attempt to re-enter fullscreen after a short delay
        if (fullscreenRetryRef.current) clearTimeout(fullscreenRetryRef.current);
        fullscreenRetryRef.current = setTimeout(() => {
          if (isActive.current && !hasAutoSubmitted.current) {
            recordViolation("fullscreen_exit");
            // Try to re-enter fullscreen
            setTimeout(() => requestFullscreen(), 500);
          }
        }, 200);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isActive.current) return;
      // Block dangerous key combos
      const blocked = [
        e.key === "F12",
        e.key === "F11",
        e.altKey && e.key === "Tab",
        e.ctrlKey && e.key.toLowerCase() === "t",
        e.ctrlKey && e.key.toLowerCase() === "w",
        e.ctrlKey && e.key.toLowerCase() === "n",
        e.ctrlKey && e.key.toLowerCase() === "c",
        e.ctrlKey && e.key.toLowerCase() === "v",
        e.ctrlKey && e.key.toLowerCase() === "u",
        e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "i",
        e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "j",
        e.ctrlKey && e.shiftKey && e.key.toLowerCase() === "c",
        e.metaKey && e.key.toLowerCase() === "t",
        e.metaKey && e.key.toLowerCase() === "w",
      ];
      if (blocked.some(Boolean)) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      if (isActive.current) e.preventDefault();
    };

    const handleSelectStart = (e: Event) => {
      // Allow selection within answer options — don't block entirely
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);
    document.addEventListener("mouseleave", handleMouseLeave);
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("keydown", handleKeyDown, true);
    document.addEventListener("contextmenu", handleContextMenu);

    return () => {
      isActive.current = false;
      if (fullscreenRetryRef.current) clearTimeout(fullscreenRetryRef.current);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
      document.removeEventListener("mouseleave", handleMouseLeave);
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("keydown", handleKeyDown, true);
      document.removeEventListener("contextmenu", handleContextMenu);
      // Exit fullscreen when leaving exam
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }
    };
  }, [isTopicMock, recordViolation, requestFullscreen]);

  return { requestFullscreen };
}
