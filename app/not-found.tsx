"use client";

import { useEffect } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import Link from "next/link";

export default function NotFound() {
  useEffect(() => {
    document.title = "Page not found · PATH CI Apparel";
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f2f2f2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "absolute",
          width: 1,
          height: 1,
          padding: 0,
          margin: -1,
          overflow: "hidden",
          clip: "rect(0, 0, 0, 0)",
          whiteSpace: "nowrap",
          border: 0,
          "&:focus": {
            position: "fixed",
            top: 8,
            left: 8,
            width: "auto",
            height: "auto",
            margin: 0,
            padding: "8px 16px",
            overflow: "visible",
            clip: "auto",
            whiteSpace: "normal",
            zIndex: 2000,
            bgcolor: "#45443F",
            color: "#fff",
            borderRadius: 1,
            fontWeight: 700,
            textDecoration: "none",
          },
        }}
      >
        Skip to content
      </Box>
      <Stack component="main" id="main-content" tabIndex={-1} spacing={3} alignItems="center" sx={{ textAlign: "center", px: 3, outline: "none" }}>
        <Typography variant="h4" component="h1" fontWeight={700} sx={{ color: "#45443F" }}>
          Page not found
        </Typography>
        <Typography variant="body1" sx={{ color: "#62615C" }}>
          This link is no longer available or has been removed.
        </Typography>
        <Button
          component={Link}
          href="/"
          variant="contained"
          sx={{
            bgcolor: "#000054",
            color: "#fff",
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 2,
            px: 3,
            py: 1,
            "&:hover": { bgcolor: "#00003f" },
          }}
        >
          Back to Homepage
        </Button>
      </Stack>
    </Box>
  );
}
