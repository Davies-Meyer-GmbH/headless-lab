import TestInfo from "../../components/test-info";
/**
 * A2: layout for Canvas-managed routes.
 *
 * Sits between the root layout and the Canvas catch-all. The banner makes
 * it visible whether this wrapper renders in the editor preview iframe or
 * only on the public site.
 */
export default function CanvasGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-a2-group="canvas" style={{ outline: "3px dashed #2e7d32" }}>
      <div
        style={{
          background: "#2e7d32",
          color: "#fff",
          padding: "0.25rem 1rem",
          fontSize: "0.75rem",
          fontFamily: "sans-serif",
        }}
      >
        A2: (canvas) group layout
      </div>
      <TestInfo />
      {children}
    </div>
  );
}
