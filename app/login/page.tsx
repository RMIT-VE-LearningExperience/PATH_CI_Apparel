"use client";

import { useEffect, useState } from "react";
import { trackEvent } from "../components/GoogleAnalytics";
import { signInWithCustomToken } from "firebase/auth";
import {
  Box,
  Button,
  Tab,
  Tabs,
  TextField,
  Typography,
  Stack,
  Alert,
  CircularProgress,
} from "@mui/material";
import { initializeFirebaseClient } from "../../lib/firebase-client";

export default function LoginPage() {
  useEffect(() => {
    document.title = "Admin login · PATH CI Apparel";
  }, []);

  const [tab, setTab] = useState(0);

  // Login state
  const [staffNumber, setStaffNumber] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  // Register state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regStaffNumber, setRegStaffNumber] = useState("");
  const [regLoading, setRegLoading] = useState(false);
  const [regError, setRegError] = useState("");
  const [regSuccess, setRegSuccess] = useState(false);

  const handleLogin = async () => {
    if (!staffNumber.trim()) {
      setLoginError("Please enter your e-number");
      return;
    }

    setLoginError("");
    setLoginLoading(true);

    try {
      const response = await fetch("/api/admin-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffNumber: staffNumber.trim() }),
      });

      const data = await response.json() as { customToken?: string; role?: string; error?: string };

      if (!response.ok) {
        setLoginError(data.error || "Login failed");
        return;
      }

      const auth = initializeFirebaseClient();
      const userCredential = await signInWithCustomToken(auth, data.customToken!);
      const idToken = await userCredential.user.getIdToken();

      // Verify token and get role
      const verifyResponse = await fetch("/api/verify-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      if (!verifyResponse.ok) {
        const verifyData = await verifyResponse.json() as { error?: string };
        setLoginError(verifyData.error || "Access not authorised");
        await auth.signOut();
        return;
      }

      const verifyData = await verifyResponse.json() as { role?: string };
      window.localStorage.setItem("adminRole", verifyData.role || "admin");
      window.localStorage.setItem("adminLoginTime", Date.now().toString());

      trackEvent("admin_login", { role: verifyData.role ?? "admin" });
      window.location.href = "/admin";
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regEmail.trim() || !regStaffNumber.trim()) {
      setRegError("All fields are required");
      return;
    }

    setRegError("");
    setRegLoading(true);

    try {
      const response = await fetch("/api/admin-register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          email: regEmail.trim(),
          staffNumber: regStaffNumber.trim(),
        }),
      });

      const data = await response.json() as { error?: string };

      if (!response.ok) {
        setRegError(data.error || "Registration failed");
        return;
      }

      setRegSuccess(true);
    } catch (err) {
      setRegError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setRegLoading(false);
    }
  };

  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#f2f2f2",
        outline: "none",
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
      <Box
        sx={{
          width: "100%",
          maxWidth: 400,
          backgroundColor: "#FFFFFF",
          borderRadius: 2,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          overflow: "hidden",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, v: number) => {
            setTab(v);
            setLoginError("");
            setRegError("");
            setRegSuccess(false);
          }}
          variant="fullWidth"
          aria-label="Admin access"
          sx={{ borderBottom: "1px solid #E5E1D7" }}
        >
          <Tab label="Login" id="login-tab-0" aria-controls="login-tabpanel-0" />
          <Tab label="Request" id="login-tab-1" aria-controls="login-tabpanel-1" />
        </Tabs>

        <Box sx={{ padding: 4 }}>
          {tab === 0 && (
            <Stack spacing={2} role="tabpanel" id="login-tabpanel-0" aria-labelledby="login-tab-0">
              <Typography variant="h5" component="h1" fontWeight={700} textAlign="center">
                Admin Login
              </Typography>

              <TextField
                label="e-number"
                value={staffNumber}
                onChange={(e) => {
                  setStaffNumber(e.target.value);
                  setLoginError("");
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && staffNumber.trim()) void handleLogin();
                }}
                fullWidth
                disabled={loginLoading}
                autoFocus
              />

              {loginError && <Alert severity="error">{loginError}</Alert>}

              <Button
                variant="contained"
                onClick={() => void handleLogin()}
                disabled={loginLoading || !staffNumber.trim()}
                fullWidth
              >
                {loginLoading ? <CircularProgress size={24} /> : "Login"}
              </Button>
            </Stack>
          )}

          {tab === 1 && (
            <Stack spacing={2} role="tabpanel" id="login-tabpanel-1" aria-labelledby="login-tab-1">
              <Typography variant="h5" component="h1" fontWeight={700} textAlign="center">
                Request for Access
              </Typography>

              {regSuccess ? (
                <Stack spacing={2}>
                  <Alert severity="success">
                    Your request has been submitted. Please contact dmd.cove@rmit.edu.au for approvals.
                  </Alert>
                  <Button onClick={() => setTab(0)}>Back to Login</Button>
                </Stack>
              ) : (
                <>
                  <TextField
                    label="Full Name"
                    value={regName}
                    onChange={(e) => {
                      setRegName(e.target.value);
                      setRegError("");
                    }}
                    fullWidth
                    disabled={regLoading}
                    autoFocus
                  />

                  <TextField
                    label="Email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => {
                      setRegEmail(e.target.value);
                      setRegError("");
                    }}
                    fullWidth
                    disabled={regLoading}
                  />

                  <TextField
                    label="e-number"
                    value={regStaffNumber}
                    onChange={(e) => {
                      setRegStaffNumber(e.target.value);
                      setRegError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") void handleRegister();
                    }}
                    fullWidth
                    disabled={regLoading}
                  />

                  {regError && <Alert severity="error">{regError}</Alert>}

                  <Button
                    variant="contained"
                    onClick={() => void handleRegister()}
                    disabled={regLoading || !regName.trim() || !regEmail.trim() || !regStaffNumber.trim()}
                    fullWidth
                  >
                    {regLoading ? <CircularProgress size={24} /> : "Submit"}
                  </Button>
                </>
              )}
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
