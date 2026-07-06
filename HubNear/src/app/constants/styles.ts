import type { CSSProperties } from "react";
import { ACCENT, ACCENT_LIGHT } from "../theme";

export const FONT = "Montserrat, sans-serif";

export const field: CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  fontFamily: FONT,
  fontSize: 16,
  outline: "none",
  color: "#374151",
  boxSizing: "border-box",
};

export const label: CSSProperties = {
  fontFamily: FONT,
  fontSize: 14,
  color: "#374151",
  display: "block",
  marginBottom: 6,
};

export const flexCenter: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

export const flexRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
};

export const flexBetween: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
};

export const flexColumn: CSSProperties = {
  display: "flex",
  flexDirection: "column",
};

export const pageContainer: CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  overflow: "hidden",
};

export const headerRow: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  background: "#fff",
  borderBottom: "1px solid #f3f4f6",
};

export const screenTitle: CSSProperties = {
  fontFamily: FONT,
  fontWeight: 200,
  color: "#111827",
  margin: 0,
};

export const backButton: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  display: "flex",
};

export const accentButton: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  background: ACCENT,
  border: "none",
  color: "#fff",
  fontFamily: FONT,
  fontWeight: 700,
  cursor: "pointer",
  transition: "all 0.2s",
};

export const ghostButton: CSSProperties = {
  background: "none",
  border: "none",
  cursor: "pointer",
  fontFamily: FONT,
};

export const mutedText: CSSProperties = {
  fontFamily: FONT,
  color: "#9ca3af",
};

export const cardShadow: CSSProperties = {
  borderRadius: 12,
  overflow: "hidden",
  position: "relative",
  boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
  width: "100%",
};

export const gradientTop: CSSProperties = {
  position: "absolute",
  top: 0, left: 0, right: 0,
  background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
};

export const gradientBottom: CSSProperties = {
  position: "absolute",
  bottom: 0, left: 0, right: 0,
  background: "linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)",
};

export const eventCardTitle: CSSProperties = {
  fontFamily: FONT,
  fontWeight: 800,
  color: "#fff",
  margin: "0 0 4px",
};

export const progressTrack: CSSProperties = {
  height: 6,
  background: "rgba(255,255,255,0.3)",
  borderRadius: 2,
  overflow: "hidden",
};

export const confirmedBadge: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
  background: "rgba(17, 111, 95, 0.9)",
  padding: "3px 8px",
  borderRadius: 8,
};

export const confirmedDot: CSSProperties = {
  width: 6,
  height: 6,
  borderRadius: "50%",
  background: "#fff",
};

export const emptyState: CSSProperties = {
  padding: 40,
  textAlign: "center",
  width: "100%",
};

export function scrollContainer(isMobile: boolean): CSSProperties {
  return {
    flex: 1,
    overflowY: "auto",
    padding: isMobile ? "12px 14px 24px" : "24px 22px 32px",
    display: isMobile ? "flex" : "grid",
    flexDirection: isMobile ? "column" : "row",
    gridTemplateColumns: isMobile ? undefined : "repeat(auto-fill, minmax(280px, 1fr))",
    alignContent: "flex-start",
    gap: 0,
  };
}

export function avatarStyle(isMobile: boolean): CSSProperties {
  return {
    width: isMobile ? 32 : 36,
    height: isMobile ? 32 : 36,
    borderRadius: "50%",
    objectFit: "cover",
    border: "2px solid #fff",
  };
}

export function categoryButton(selected: boolean, isMobile: boolean): CSSProperties {
  return {
    padding: isMobile ? "6px 14px" : "8px 16px",
    borderRadius: 10,
    background: selected ? ACCENT : "#f3f4f6",
    border: "none",
    color: selected ? "#fff" : "#374151",
    fontFamily: FONT,
    fontSize: isMobile ? 13 : 14,
    fontWeight: selected ? 600 : 400,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };
}

export function joinButton(
  isJoined: boolean,
  spotsLeft: number,
): CSSProperties {
  return {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    background: isJoined ? "rgba(255,255,255,0.2)" : spotsLeft <= 0 ? "rgba(255,255,255,0.15)" : ACCENT,
    border: isJoined ? "1px solid rgba(255,255,255,0.4)" : "none",
    color: "#fff",
    fontFamily: FONT,
    fontWeight: 700,
    fontSize: 14,
    cursor: spotsLeft <= 0 && !isJoined ? "not-allowed" : "pointer",
    transition: "all 0.2s",
  };
}

export function progressFill(confirmed: boolean, progress: number): CSSProperties {
  return {
    height: "100%",
    width: `${Math.min(progress, 100)}%`,
    background: confirmed ? "#86efac" : progress >= 100 ? "#22c55e" : ACCENT_LIGHT,
    borderRadius: 2,
    transition: "width 0.3s ease",
  };
}

export function feedIconButton(size: number): CSSProperties {
  return {
    background: ACCENT,
    border: "none",
    borderRadius: "50%",
    width: size,
    height: size,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };
}
