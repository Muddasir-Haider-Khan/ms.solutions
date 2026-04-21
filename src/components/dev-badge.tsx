"use client";

import { useState } from "react";

export function DevBadge() {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href="https://afrazkhan.com"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Built by Afraz Khan — afrazkhan.com"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        bottom: "20px",
        right: "20px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        gap: "0",
        borderRadius: "100px",
        overflow: "hidden",
        boxShadow: hovered
          ? "0 8px 32px rgba(0,0,0,0.22), 0 2px 8px rgba(0,121,107,0.18)"
          : "0 4px 18px rgba(0,0,0,0.16), 0 1px 4px rgba(0,0,0,0.10)",
        transform: hovered ? "translateY(-2px) scale(1.03)" : "translateY(0) scale(1)",
        transition: "box-shadow 0.22s ease, transform 0.22s ease",
        textDecoration: "none",
        cursor: "pointer",
        userSelect: "none",
      }}
    >
      {/* Left pill — dark */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          backgroundColor: "#111111",
          padding: "7px 10px 7px 12px",
        }}
      >
        {/* Code brackets icon */}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00796b"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ flexShrink: 0 }}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            color: "rgba(255,255,255,0.45)",
            letterSpacing: "0.04em",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          built by
        </span>
      </span>

      {/* Right pill — teal */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          gap: "5px",
          backgroundColor: "#00796b",
          padding: "7px 13px 7px 10px",
          transition: "background-color 0.22s ease",
          ...(hovered ? { backgroundColor: "#00695c" } : {}),
        }}
      >
        {/* Minimal avatar mark */}
        <span
          style={{
            width: "16px",
            height: "16px",
            borderRadius: "50%",
            backgroundColor: "rgba(255,255,255,0.18)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "9px",
              fontWeight: 800,
              color: "#ffffff",
              lineHeight: 1,
              letterSpacing: "-0.02em",
            }}
          >
            A
          </span>
        </span>
        <span
          style={{
            fontSize: "12px",
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: "-0.01em",
            fontFamily: "inherit",
            whiteSpace: "nowrap",
          }}
        >
          afrazkhan.com
        </span>
      </span>
    </a>
  );
}
