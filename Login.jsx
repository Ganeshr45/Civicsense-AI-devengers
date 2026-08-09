import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const [step, setStep] = useState("phone");
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleRequestOtp(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.requestOtp(phone, name);
      setDevOtp(res.dev_otp);
      setStep("code");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerify(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const res = await api.verifyOtp(phone, code);
      login(res.access_token, res.user);
      navigate(res.user.role === "citizen" ? "/dashboard" : "/gov");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-md mx-auto px-6 py-20">
      <h1 className="font-display font-700 text-3xl mb-2">Sign in</h1>
      <p className="text-ink/60 mb-8 text-sm">Quick OTP login — no password needed.</p>

      {step === "phone" && (
        <form onSubmit={handleRequestOtp} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Your name</label>
            <input
              className="w-full border border-line rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anita Desai"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone number</label>
            <input
              required
              className="w-full border border-line rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+919876500010"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-full bg-teal text-white py-3 font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {busy ? "Sending..." : "Send OTP"}
          </button>
          <p className="text-xs text-ink/40">
            Demo accounts: officer <span className="font-mono">+919876500001</span>, admin{" "}
            <span className="font-mono">+919876500002</span>, citizens{" "}
            <span className="font-mono">+919876500010</span>–<span className="font-mono">13</span>
          </p>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleVerify} className="space-y-4">
          <div className="bg-amber/10 border border-amber/30 rounded-lg px-4 py-3 text-sm">
            No SMS gateway is wired up for this demo — your code is:{" "}
            <span className="font-mono font-bold">{devOtp}</span>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Enter 6-digit code</label>
            <input
              required
              maxLength={6}
              className="w-full border border-line rounded-lg px-4 py-3 tracking-[0.3em] font-mono focus:outline-none focus:ring-2 focus:ring-teal"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="000000"
            />
          </div>
          {error && <p className="text-rust text-sm">{error}</p>}
          <button
            disabled={busy}
            className="w-full rounded-full bg-teal text-white py-3 font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            {busy ? "Verifying..." : "Verify & sign in"}
          </button>
        </form>
      )}
    </div>
  );
}
