"use client";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { Add as AddIcon, Crop as CropIcon } from "@mui/icons-material";
import { useEffect, useRef, useState } from "react";
import RichTextEditor from "../RichTextEditor";
import { validateImageFile, processUpload } from "../utils/imageUpload";
import { DIALOG_PAPER_SX, DIALOG_TITLE_SX, DIALOG_ACTIONS_SX, PRIMARY_BTN_SX, CANCEL_BTN_SX, UPLOAD_BTN_SX } from "./dialogStyles";
import ImageCropDialog from "./ImageCropDialog";

function getVideoEmbedUrl(url: string): string | null {
  if (!url.trim()) return null;
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) return url;
  return null;
}

type SaveData = {
  title: string;
  contentHtml: string;
  imageDataUrl: string;
  videoUrl: string;
  stepType: "main" | "sub";
  parentStepId: string | null;
};

type MainStepOption = { id: string; title: string };

type Props = {
  open: boolean;
  onClose: () => void;
  onSave: (data: SaveData) => void;
  loading?: boolean;
  mode: "add" | "edit";
  stepLabel?: string;
  stepId?: string;
  stepType: "main" | "sub";
  parentStepId?: string | null;
  mainSteps: MainStepOption[];
  initialData?: {
    title?: string;
    contentHtml?: string;
    imageUrl?: string;
    videoUrl?: string;
  };
};

export default function AddEditStepDialog({
  open,
  onClose,
  onSave,
  loading,
  mode,
  stepLabel,
  stepId,
  stepType: initialStepType,
  parentStepId: initialParentStepId,
  mainSteps,
  initialData,
}: Props) {
  const [title, setTitle] = useState("");
  const [contentHtml, setContentHtml] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [imageError, setImageError] = useState("");
  const [compressed, setCompressed] = useState(false);
  const [cropOpen, setCropOpen] = useState(false);
  const [stepType, setStepType] = useState<"main" | "sub">("main");
  const [parentStepId, setParentStepId] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | "none">("none");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const originalImageRef = useRef("");
  const prevOpenRef = useRef(false);

  // Available parents exclude the step itself (a step can't be its own parent).
  const parentOptions = mainSteps.filter((s) => s.id !== stepId);

  useEffect(() => {
    if (!open) {
      prevOpenRef.current = false;
      return;
    }
    if (prevOpenRef.current) return;
    prevOpenRef.current = true;
    setTitle(initialData?.title ?? "");
    setContentHtml(initialData?.contentHtml ?? "");
    setImageDataUrl(initialData?.imageUrl ?? "");
    originalImageRef.current = initialData?.imageUrl ?? "";
    setVideoUrl(initialData?.videoUrl ?? "");
    setImageError("");
    setCompressed(false);
    setCropOpen(false);
    setStepType(initialStepType);
    setParentStepId(initialParentStepId ?? null);
    setMediaType(initialData?.videoUrl ? "video" : initialData?.imageUrl ? "image" : "none");
  }, [open, initialData, initialStepType, initialParentStepId]);

  function handleMediaTypeChange(next: "image" | "video" | "none" | null) {
    if (!next) return;
    setMediaType(next);
    if (next !== "video") setVideoUrl("");
    if (next !== "image") clearImage();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const err = validateImageFile(file);
    if (err) { setImageError(err); return; }
    setImageError("");
    const { dataUrl, compressed: wasCompressed } = await processUpload(file);
    setImageDataUrl(dataUrl);
    originalImageRef.current = dataUrl;
    setCompressed(wasCompressed);
    e.target.value = "";
  }

  function clearImage() {
    setImageDataUrl("");
    originalImageRef.current = "";
    setCompressed(false);
  }

  function handleSave() {
    if (!title.trim()) return;
    if (stepType === "sub" && !parentStepId) return;
    onSave({
      title: title.trim(),
      contentHtml,
      imageDataUrl,
      videoUrl: videoUrl.trim(),
      stepType,
      parentStepId: stepType === "sub" ? parentStepId : null,
    });
  }

  const embedUrl = getVideoEmbedUrl(videoUrl);
  const isDirectVideo = /\.(mp4|webm|ogg)(\?.*)?$/i.test(videoUrl);
  const canSave = title.trim() && (stepType === "main" || !!parentStepId);

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: DIALOG_PAPER_SX }}>
        <DialogTitle sx={DIALOG_TITLE_SX}>Step {stepLabel ?? "1"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ pt: 2 }}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <FormControl size="small" sx={{ minWidth: 160 }} disabled={parentOptions.length === 0}>
                <InputLabel id="step-type-label">Step type</InputLabel>
                <Select
                  labelId="step-type-label"
                  label="Step type"
                  value={stepType}
                  onChange={(e) => {
                    const next = e.target.value as "main" | "sub";
                    setStepType(next);
                    if (next === "sub" && !parentStepId) {
                      setParentStepId(parentOptions[0]?.id ?? null);
                    }
                  }}
                >
                  <MenuItem value="main">Main step</MenuItem>
                  <MenuItem value="sub" disabled={parentOptions.length === 0}>Sub-step</MenuItem>
                </Select>
              </FormControl>

              {stepType === "sub" && (
                <FormControl size="small" sx={{ minWidth: 200, flex: 1 }} required>
                  <InputLabel id="parent-step-label">Under main step</InputLabel>
                  <Select
                    labelId="parent-step-label"
                    label="Under main step"
                    value={parentStepId ?? ""}
                    onChange={(e) => setParentStepId(e.target.value || null)}
                  >
                    {parentOptions.map((s) => (
                      <MenuItem key={s.id} value={s.id}>{s.title || "Untitled step"}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </Stack>

            <TextField
              label="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              size="small"
              autoFocus
            />

            <RichTextEditor label="Content" value={contentHtml} onChange={setContentHtml} />

            {/* Media section: a step carries at most one of image or video */}
            <Box>
              <Typography variant="body2" fontWeight={500} sx={{ mb: 1 }}>Media</Typography>
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Optional &mdash; image or video, not both</Typography>
              <ToggleButtonGroup
                exclusive
                size="small"
                value={mediaType}
                onChange={(_e, next) => handleMediaTypeChange(next)}
                sx={{ mb: 2 }}
              >
                <ToggleButton value="none" sx={{ textTransform: "none" }}>None</ToggleButton>
                <ToggleButton value="image" sx={{ textTransform: "none" }}>Image</ToggleButton>
                <ToggleButton value="video" sx={{ textTransform: "none" }}>Video</ToggleButton>
              </ToggleButtonGroup>

              {mediaType === "image" && (
              <Box>
                {!imageDataUrl && (
                  <Stack direction="row" alignItems="center" spacing={1.5}>
                    <IconButton onClick={() => fileInputRef.current?.click()} sx={UPLOAD_BTN_SX}>
                      <AddIcon />
                    </IconButton>
                    <Typography variant="caption" color="text.secondary">
                      JPEG, PNG, or GIF · max 700 KB
                    </Typography>
                  </Stack>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif"
                  style={{ display: "none" }}
                  onChange={(e) => void handleFileChange(e)}
                />

                {imageError && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 0.5 }}>
                    {imageError}
                  </Typography>
                )}
                {compressed && (
                  <Typography variant="caption" display="block" sx={{ mt: 0.5, color: "#f59e0b" }}>
                    Image was compressed to meet the 700 KB limit.
                  </Typography>
                )}

                {imageDataUrl && (
                  <Box sx={{ mt: 2, display: "flex", gap: 2, alignItems: "flex-start" }}>
                    <Box sx={{ position: "relative", display: "inline-block" }}>
                      <Box
                        component="img"
                        src={imageDataUrl}
                        alt="Step image preview"
                        sx={{
                          width: 220, maxWidth: "100%", aspectRatio: "4/3",
                          objectFit: "cover", borderRadius: 1,
                          border: "1px solid", borderColor: "divider",
                          display: "block",
                        }}
                      />
                      <IconButton
                        size="small"
                        onClick={clearImage}
                        sx={{ position: "absolute", top: 0, right: 0, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}
                      >
                        ✕
                      </IconButton>
                    </Box>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mt: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<CropIcon />}
                        onClick={() => setCropOpen(true)}
                        sx={{ color: "#000054", borderColor: "#000054", textTransform: "none", fontWeight: 600 }}
                      >
                        Crop
                      </Button>
                    </Box>
                  </Box>
                )}
              </Box>
              )}

              {mediaType === "video" && (
              <Stack spacing={1.5}>
                <TextField
                  label="Video URL"
                  placeholder="YouTube, Vimeo, or direct .mp4 link"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  fullWidth
                  size="small"
                />
                {embedUrl && (
                  <Box sx={{ position: "relative" }}>
                    {isDirectVideo ? (
                      <Box component="video" controls src={videoUrl} sx={{ width: "100%", borderRadius: 1 }} />
                    ) : (
                      <Box sx={{ position: "relative", width: "100%", paddingBottom: "56.25%", borderRadius: 1, overflow: "hidden" }}>
                        <Box
                          component="iframe"
                          src={embedUrl}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          sx={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                        />
                      </Box>
                    )}
                    <IconButton
                      size="small"
                      onClick={() => setVideoUrl("")}
                      sx={{ position: "absolute", top: 4, right: 4, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "#fff" } }}
                    >
                      ✕
                    </IconButton>
                  </Box>
                )}
              </Stack>
              )}
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions sx={DIALOG_ACTIONS_SX}>
          <Button onClick={onClose} disabled={loading} sx={CANCEL_BTN_SX}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={loading || !canSave}
            sx={PRIMARY_BTN_SX}
          >
            {loading
              ? (mode === "add" ? "Adding..." : "Saving...")
              : (mode === "add" ? "Add Step" : "Save")}
          </Button>
        </DialogActions>
      </Dialog>

      <ImageCropDialog
        open={cropOpen}
        onClose={() => setCropOpen(false)}
        imageDataUrl={imageDataUrl}
        originalDataUrl={originalImageRef.current}
        onApply={(cropped) => setImageDataUrl(cropped)}
      />
    </>
  );
}
