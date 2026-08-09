import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client";

export default function ReportForm() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [description, setDescription] = useState("");
  const [coords, setCoords] = useState(null);
  const [address, setAddress] = useState("");
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const fileInput = useRef(null);
  const navigate = useNavigate();

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImage(file);
    setPreview(URL.createObjectURL(file));
  }

  function useMyLocation() {
    setLocating(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Geolocation isn't available in this browser. Enter coordinates manually.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => {
        setError("Couldn't get your location. Try again or enter coordinates manually.");
        setLocating(false);
      }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!image) return setError("Please attach a photo of the issue.");
    if (!coords) return setError("Please share your location.");

    setSubmitting(true);
    try {
      const form = new FormData();
      form.append("image", image);
      form.append("latitude", coords.lat);
      form.append("longitude", coords.lng);
      if (address) form.append("address", address);
      if (description) form.append("description", description);

      const report = await api.createReport(form);
      setResult(report);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div className="max-w-lg mx-auto px-6 py-20">
        <div className="ticket rounded-2xl p-8">
          <p className="font-mono text-xs text-ink/40 mb-1">TICKET #{result.id.slice(0, 8).toUpperCase()}</p>
          <h2 className="font-display font-700 text-2xl mb-4">Report submitted</h2>
          <div className="stub-divider pl-4 space-y-1 text-sm">
            <p>
              AI classified this as <strong className="capitalize">{result.category.replace("_", " ")}</strong>
              {" "}(severity: <strong className="capitalize">{result.severity}</strong>, confidence{" "}
              {(result.ai_confidence * 100).toFixed(0)}%, via {result.ai_source})
            </p>
            <p className="capitalize">Current status: {result.status.replace("_", " ")}</p>
          </div>
        </div>
        <div className="flex gap-4 mt-6">
          <button
            onClick={() => navigate(`/reports/${result.id}`)}
            className="rounded-full bg-teal text-white px-6 py-3 font-medium hover:bg-teal-dark"
          >
            Track this report
          </button>
          <button
            onClick={() => {
              setResult(null);
              setImage(null);
              setPreview(null);
              setDescription("");
              setCoords(null);
            }}
            className="rounded-full border border-ink px-6 py-3 font-medium hover:bg-ink hover:text-white"
          >
            Report another issue
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-6 py-16">
      <h1 className="font-display font-700 text-3xl mb-2">Report an issue</h1>
      <p className="text-ink/60 mb-8 text-sm">Attach a photo and share your location — AI handles the rest.</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-medium mb-2">Photo</label>
          <div
            onClick={() => fileInput.current?.click()}
            className="border-2 border-dashed border-line rounded-xl h-56 flex items-center justify-center cursor-pointer overflow-hidden hover:border-teal transition-colors"
          >
            {preview ? (
              <img src={preview} alt="preview" className="w-full h-full object-cover" />
            ) : (
              <p className="text-ink/40 text-sm">Tap to take or upload a photo</p>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          {coords ? (
            <p className="text-sm font-mono bg-teal/10 text-teal rounded-lg px-4 py-3">
              {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
            </p>
          ) : (
            <button
              type="button"
              onClick={useMyLocation}
              disabled={locating}
              className="rounded-full border border-ink px-5 py-2.5 text-sm font-medium hover:bg-ink hover:text-white transition-colors disabled:opacity-50"
            >
              {locating ? "Locating..." : "Use my current location"}
            </button>
          )}
          <input
            className="w-full mt-2 border border-line rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            placeholder="Landmark or address (optional)"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description (optional)</label>
          <textarea
            className="w-full border border-line rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Anything the photo doesn't capture..."
          />
        </div>

        {error && <p className="text-rust text-sm">{error}</p>}

        <button
          disabled={submitting}
          className="w-full rounded-full bg-teal text-white py-3 font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
        >
          {submitting ? "Analyzing photo..." : "Submit report"}
        </button>
      </form>
    </div>
  );
}
