import { useIsMobile } from "../components/ui/use-mobile";
import { ACCENT_LIGHT } from "../theme";

function Shimmer({ style }: { style?: React.CSSProperties }) {
  return (
    <div
      style={{
        height: "100%",
        width: "100%",
        background: `linear-gradient(90deg, ${ACCENT_LIGHT}15 25%, ${ACCENT_LIGHT}30 50%, ${ACCENT_LIGHT}15 75%)`,
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function SkeletonCard() {
  const isMobile = useIsMobile();

  return (
    <div style={{ padding: isMobile ? "0 0 16px 0" : "12px", boxSizing: "border-box" }}>
      <div
        style={{
          borderRadius: 12,
          overflow: "hidden",
          position: "relative",
          aspectRatio: isMobile ? "1 / 1.15" : "1 / 1.1",
          background: "#f0f0f0",
          width: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0, left: 0, right: 0,
            padding: isMobile ? "12px 14px 40px" : "14px 16px 44px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
          }}
        >
          <div style={{ flex: 1 }}>
            <div style={{ width: "60%", height: isMobile ? 18 : 20, borderRadius: 4, overflow: "hidden", marginBottom: 6 }}>
              <Shimmer />
            </div>
            <div style={{ width: "40%", height: 14, borderRadius: 4, overflow: "hidden" }}>
              <Shimmer />
            </div>
          </div>
          <div style={{
            width: isMobile ? 32 : 36,
            height: isMobile ? 32 : 36,
            borderRadius: "50%",
            overflow: "hidden",
            flexShrink: 0,
          }}>
            <Shimmer />
          </div>
        </div>

        <div
          style={{
            position: "absolute",
            bottom: 0, left: 0, right: 0,
            padding: isMobile ? "40px 14px 14px" : "44px 16px 16px",
          }}
        >
          <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
            <div style={{ width: 80, height: isMobile ? 14 : 15, borderRadius: 4, overflow: "hidden" }}>
              <Shimmer />
            </div>
            <div style={{ width: 100, height: isMobile ? 14 : 15, borderRadius: 4, overflow: "hidden" }}>
              <Shimmer />
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 60, height: isMobile ? 14 : 15, borderRadius: 4, overflow: "hidden" }}>
              <Shimmer />
            </div>
            <div style={{ width: 70, height: isMobile ? 14 : 15, borderRadius: 4, overflow: "hidden" }}>
              <Shimmer />
            </div>
          </div>

          <div style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <div style={{ width: 50, height: 12, borderRadius: 4, overflow: "hidden" }}>
                <Shimmer />
              </div>
              <div style={{ width: 65, height: 12, borderRadius: 4, overflow: "hidden" }}>
                <Shimmer />
              </div>
            </div>
            <div style={{ height: 6, borderRadius: 2, overflow: "hidden" }}>
              <Shimmer />
            </div>
          </div>

          <div style={{
            width: "100%",
            padding: "10px",
            borderRadius: 8,
            background: "#e0e0e0",
            height: isMobile ? 38 : 40,
          }} />
        </div>
      </div>
    </div>
  );
}
